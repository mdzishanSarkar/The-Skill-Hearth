import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import axios from 'axios';
import dns from 'node:dns/promises';
import net from 'node:net';
import { HttpError } from './errors';

const SMTP_TIMEOUT_MS = 10_000;
const MAX_CANDIDATE_ATTEMPTS = 4;

export function getClientUrl(): string {
  const url = process.env.CLIENT_URL || 'https://the-skill-hearth.onrender.com';
  return url.replace(/\/+$/, '');
}

export function getEmailFrom(): string {
  if (process.env.EMAIL_FROM) {
    return process.env.EMAIL_FROM.replace(/^["']|["']$/g, '');
  }
  const user = process.env.SMTP_USER || 'no-reply@example.com';
  return `"The Skill Hearth" <${user}>`;
}

export function smtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function validateSmtpConfiguration(): void {
  if (resendConfigured()) return;

  const missing = [
    !process.env.SMTP_HOST && 'SMTP_HOST',
    !process.env.SMTP_PORT && 'SMTP_PORT',
    !process.env.SMTP_USER && 'SMTP_USER',
    !process.env.SMTP_PASS && 'SMTP_PASS',
  ].filter(Boolean) as string[];

  if (missing.length === 0) return;

  console.warn(
    `[email] ⚠️ SMTP is not fully configured. Missing: ${missing.join(', ')}. Email delivery will fail.`
  );
}

function isRetryableNetworkError(error: any): boolean {
  const code: string = error?.code || '';
  const message: string = error?.message || '';
  return (
    code === 'ETIMEDOUT' ||
    code === 'ESOCKET' ||
    code === 'EAI_AGAIN' ||
    code === 'ECONNREFUSED' ||
    code === 'ENETUNREACH' ||
    code === 'ECONNRESET' ||
    code === 'EADDRNOTAVAIL' ||
    code === 'EDNS' ||
    code === 'ECONNECTION' ||
    /Connection timeout|getaddrinfo|greeting timed out/i.test(message)
  );
}

function getSmtpHostname(): string {
  return process.env.SMTP_HOST || 'smtp.gmail.com';
}

async function resolveIpv4Addresses(hostname: string): Promise<string[]> {
  if (net.isIP(hostname)) {
    return net.isIPv6(hostname) ? [] : [hostname];
  }

  try {
    const addresses = await dns.resolve4(hostname);
    if (addresses && addresses.length > 0) return addresses;
  } catch (e) {
  }

  try {
    const lookup = await dns.lookup(hostname, { family: 4, all: true });
    return lookup.map((entry) => entry.address);
  } catch {
    return [];
  }
}

async function buildCandidatePairs(): Promise<Array<[string, number]>> {
  const hostname = getSmtpHostname();
  const configuredPort = Number(process.env.SMTP_PORT) || 587;
  const ports = configuredPort === 465 ? [465, 587] : [587, 465];

  const hosts = await resolveIpv4Addresses(hostname);

  const candidates: Array<[string, number]> = [];
  
  const targetHosts = hosts.length > 0 ? hosts : [hostname];

  for (const port of ports) {
    for (const host of targetHosts) {
      candidates.push([host, port]);
    }
  }

  return candidates.slice(0, MAX_CANDIDATE_ATTEMPTS);
}


function buildTransporter(host: string, port: number): Transporter {
  const isSecure = port === 465;
  const hostname = getSmtpHostname();

  const transportOptions: any = {
    host,
    port,
    secure: isSecure,
    family: 4,      
    ipFamily: 4,   
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    auth: {
      user: process.env.SMTP_USER?.trim() || '',
      pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
      minVersion: 'TLSv1.2',
      servername: hostname, 
    },
  };

  return nodemailer.createTransport(transportOptions);
}

async function sendWithResend(
  to: string,
  subject: string,
  html: string,
  from: string
): Promise<string> {
  let response;
  try {
    response = await axios.post(
      'https://api.resend.com/emails',
      { from, to: [to], subject, html },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: SMTP_TIMEOUT_MS,
      }
    );
  } catch (error: any) {
    const body = error?.response?.data;
    const reason =
      (body && (body.message || body.error?.message || body.error)) ||
      error?.message ||
      'unknown Resend error';
    const status = error?.response?.status;
    if (status === 403 && /onboarding@resend\.dev/.test(from)) {
      throw new HttpError(
        503,
        'RESEND_SENDER_NOT_VERIFIED',
        `Resend rejected the send (${reason}). You are using the shared sender "onboarding@resend.dev", which only allows delivering to your own Resend account email. Add and verify a domain in your Resend dashboard and set EMAIL_FROM to an address on that domain (e.g. "The Skill Hearth <no-reply@yourdomain.com>"), then set the same EMAIL_FROM and RESEND_API_KEY in the Render dashboard.`
      );
    }
    throw new HttpError(
      503,
      'RESEND_DELIVERY_FAILED',
      `Resend delivery failed (HTTP ${status || 'n/a'}): ${reason}`
    );
  }

  return response.data?.id || 'resend-delivery';
}

export interface SendEmailResult {
  delivered: boolean;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  link?: string
): Promise<SendEmailResult> {
  if (process.env.NODE_ENV !== 'production' && link) {
    console.log(`\n📧 [dev preview] To: ${to} | Subject: ${subject}`);
    console.log(`🔗 Link: ${link}\n`);
  }

  if (!resendConfigured() && !smtpConfigured()) {
    throw new HttpError(503, 'EMAIL_DELIVERY_UNAVAILABLE', 'Email configuration missing.');
  }

  try {
    const fromAddress = getEmailFrom();

    // Strategy 1: Resend (Best for Render Production)
    if (resendConfigured()) {
      const messageId = await sendWithResend(to, subject, html, fromAddress);
      console.log(`✉️ Email delivered via Resend | ID: ${messageId}`);
      return { delivered: true };
    }

    // Strategy 2: SMTP (Local Dev or IPv4 Capable Hosts)
    const candidates = await buildCandidatePairs();
    let lastError: any = null;

    for (const [host, port] of candidates) {
      try {
        const transporter = buildTransporter(host, port);
        const info = await transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          html,
        });

        console.log(`✉️ Email delivered via ${host}:${port} | ID: ${info.messageId}`);
        return { delivered: true };
      } catch (error: any) {
        lastError = error;
        if (!isRetryableNetworkError(error)) break;
        console.warn(`[email] ⚠️ ${host}:${port} failed (${error.code}); trying next...`);
      }
    }

    throw lastError || new Error('All SMTP candidates failed');
  } catch (error: any) {
    console.error(`❌ Email FAILED to ${to}:`, error.message);
    throw new HttpError(
      503,
      'EMAIL_DELIVERY_FAILED',
      `The verification email could not be sent: ${error.message}`
    );
  }
}

export function buildVerificationLink(token: string): string {
  return `${getClientUrl()}/verify-email/${token}`;
}

export function buildPasswordResetLink(token: string): string {
  return `${getClientUrl()}/reset-password/${token}`;
}

export async function sendVerificationEmail(to: string, token: string): Promise<SendEmailResult> {
  const link = buildVerificationLink(token);
  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2>Welcome to The Skill Hearth</h2>
      <p>Please verify your email to start:</p>
      <a href="${link}" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Verify My Email</a>
    </div>
  `;
  return sendEmail(to, 'Verify your email — The Skill Hearth', html, link);
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<SendEmailResult> {
  const link = buildPasswordResetLink(token);
  const html = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2>Reset your password</h2>
      <a href="${link}" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">Reset My Password</a>
    </div>
  `;
  return sendEmail(to, 'Reset your password — The Skill Hearth', html, link);
}