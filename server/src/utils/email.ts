import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { isIP } from 'node:net';
import * as dns from 'node:dns';
import { resolve4 } from 'node:dns/promises';
import { HttpError } from './errors';

// 30 seconds timeout to handle Render cold starts
const SMTP_TIMEOUT_MS = 30_000;

let transporter: Transporter | null = null;

/**
 * Dynamically resolves the Frontend Client URL (removes any trailing slash).
 */
export function getClientUrl(): string {
  const url = process.env.CLIENT_URL || 'http://localhost:5173';
  return url.replace(/\/+$/, '');
}

/**
 * Dynamically resolves the sender email address to ensure compliance with Gmail SMTP.
 */
export function getEmailFrom(): string {
  if (process.env.EMAIL_FROM) {
    return process.env.EMAIL_FROM.replace(/^["']|["']$/g, '');
  }

  const user = process.env.SMTP_USER || 'no-reply@example.com';
  return `"The Skill Hearth" <${user}>`;
}

/**
 * Checks if all required SMTP environment variables are present.
 */
export function smtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

/**
 * Validates configuration at server boot and logs warnings if keys are missing.
 */
export function validateSmtpConfiguration(): void {
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

/**
 * Nodemailer v9 resolves both A and AAAA records itself and dials a randomly
 * picked address. On hosts without IPv6 routing (e.g. Render) that random pick
 * can land on an unreachable IPv6 address, making delivery fail with
 * ENETUNREACH. Resolve the SMTP host to a literal IPv4 so the transport always
 * connects over IPv4, while keeping the original hostname for TLS SNI.
 */
async function resolveSmptHostIpv4(hostname: string): Promise<string> {
  // Some hosts (dev machines, restricted sandboxes) have a flaky default
  // resolver for external domains; try a known public resolver first.
  const resolver = new dns.Resolver();
  resolver.setServers(['8.8.8.8', '1.1.1.1']);
  const attempts: Array<() => Promise<string[]>> = [
    () =>
      new Promise((resolve, reject) => {
        resolver.resolve4(hostname, (err, addresses) => (err ? reject(err) : resolve(addresses)));
      }),
    () => resolve4(hostname),
  ];

  for (const attempt of attempts) {
    try {
      const addresses = await attempt();
      if (addresses.length > 0) return addresses[0];
    } catch {
      // fall through to the next strategy
    }
  }

  console.warn(
    `[email] ⚠️ Could not resolve IPv4 for SMTP host "${hostname}". Using hostname directly.`
  );
  return hostname;
}

/**
 * Creates or returns the singleton Nodemailer transporter.
 */
async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  const hostname = process.env.SMTP_HOST || 'smtp.gmail.com';
  const host = isIP(hostname) ? hostname : await resolveSmptHostIpv4(hostname);
  const port = Number(process.env.SMTP_PORT) || 587;
  const isSecure = port === 465;

  const transportOptions: any = {
    host,
    port,
    secure: isSecure, // false for 587, true for 465
    family: 4, // Force IPv4 connection to prevent ENETUNREACH on Render
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
      servername: hostname, // keep SNI/cert validation against the real hostname
    },
  };

  transporter = nodemailer.createTransport(transportOptions);
  return transporter;
}

export interface SendEmailResult {
  delivered: boolean;
}

/**
 * Internal email dispatch handler.
 */
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

  if (!smtpConfigured()) {
    console.error('[email] Cannot send email: SMTP credentials are missing.');
    throw new HttpError(
      503,
      'EMAIL_DELIVERY_UNAVAILABLE',
      'Email delivery is not configured on the server. Please contact support.'
    );
  }

  try {
    const fromAddress = getEmailFrom();
    const info = await (await getTransporter()).sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });

    console.log(`✉️ Email successfully delivered to ${to} | Message ID: ${info.messageId}`);
    return { delivered: true };
  } catch (error: any) {
    console.error(`❌ Email delivery FAILED to ${to}:`, {
      message: error?.message,
      code: error?.code,
      response: error?.response,
    });

    throw new HttpError(
      503,
      'EMAIL_DELIVERY_FAILED',
      `The verification email could not be sent: ${error?.message || 'SMTP delivery failed'}`
    );
  }
}

export function buildVerificationLink(token: string): string {
  return `${getClientUrl()}/verify-email/${token}`;
}

export function buildPasswordResetLink(token: string): string {
  return `${getClientUrl()}/reset-password/${token}`;
}

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<SendEmailResult> {
  const link = buildVerificationLink(token);
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: #111827; margin-bottom: 16px;">Welcome to The Skill Hearth</h2>
      <p style="color: #374151; font-size: 15px; line-height: 1.6;">Thanks for joining! Please verify your email to start exploring and sharing skills:</p>
      <div style="margin: 28px 0;">
        <a href="${link}" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Verify My Email</a>
      </div>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #eaeaea; padding-top: 16px;">
        This link expires in 24 hours. If you did not create an account, you can safely ignore this email.
      </p>
    </div>
  `;
  return sendEmail(to, 'Verify your email — The Skill Hearth', html, link);
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<SendEmailResult> {
  const link = buildPasswordResetLink(token);
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 8px;">
      <h2 style="color: #111827; margin-bottom: 16px;">Reset your password</h2>
      <p style="color: #374151; font-size: 15px; line-height: 1.6;">You requested a password reset for your The Skill Hearth account:</p>
      <div style="margin: 28px 0;">
        <a href="${link}" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Reset My Password</a>
      </div>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #eaeaea; padding-top: 16px;">
        This link expires in 1 hour. If you did not make this request, you can safely ignore this email.
      </p>
    </div>
  `;
  return sendEmail(to, 'Reset your password — The Skill Hearth', html, link);
}