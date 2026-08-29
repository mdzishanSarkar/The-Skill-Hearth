import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { HttpError } from './errors';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const EMAIL_FROM = process.env.EMAIL_FROM || '"The Skill Hearth" <no-reply@gmail.com>';
const SMTP_TIMEOUT_MS = 15_000;

let transporter: Transporter | null = null;

export function smtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

export function validateSmtpConfiguration(): void {
  const missing = [
    !process.env.SMTP_HOST && 'SMTP_HOST',
    !process.env.SMTP_PORT && 'SMTP_PORT',
    !process.env.SMTP_USER && 'SMTP_USER',
    !process.env.SMTP_PASS && 'SMTP_PASS',
  ].filter(Boolean) as string[];

  if (missing.length === 0) return;

  console.warn(
    `[email] SMTP is not fully configured. Missing: ${missing.join(', ')}. Email delivery will fail until these values are set in the server environment.`
  );
}

function getTransporter(): Transporter {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
  return transporter;
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
    console.log(`\n📧 [dev] To: ${to} | Subject: ${subject}`);
    console.log(`🔗 ${link}\n`);
  }

  if (!smtpConfigured()) {
    throw new HttpError(
      503,
      'EMAIL_DELIVERY_UNAVAILABLE',
      'Email delivery is not configured. Please try again later.'
    );
  }

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      getTransporter().sendMail({ from: EMAIL_FROM, to, subject, html }),
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`SMTP send timed out after ${SMTP_TIMEOUT_MS}ms`));
        }, SMTP_TIMEOUT_MS);
      }),
    ]);
    console.log(`✉️  Email sent to ${to} | ${subject}`);
    return { delivered: true };
  } catch (error) {
    console.error(`Email send FAILED for ${to}:`, error);
    throw new HttpError(
      503,
      'EMAIL_DELIVERY_FAILED',
      'The verification email could not be sent. Please try again.'
    );
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

export function buildVerificationLink(token: string): string {
  return `${CLIENT_URL}/verify-email/${token}`;
}

export function buildPasswordResetLink(token: string): string {
  return `${CLIENT_URL}/reset-password/${token}`;
}

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<SendEmailResult> {
  const link = buildVerificationLink(token);
  const html = `<div style="font-family:sans-serif;max-width:480px;margin:auto">
    <h2>Welcome to The Skill Hearth</h2>
    <p>Thanks for joining! Please verify your email to start sharing skills:</p>
    <p><a href="${link}" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">Verify my email</a></p>
    <p style="color:#666;font-size:13px">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
  </div>`;
  return sendEmail(to, 'Verify your email — The Skill Hearth', html, link);
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<SendEmailResult> {
  const link = buildPasswordResetLink(token);
  const html = `<div style="font-family:sans-serif;max-width:480px;margin:auto">
    <h2>Reset your password</h2>
    <p>You requested a password reset for The Skill Hearth:</p>
    <p><a href="${link}" style="background:#4f46e5;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">Reset my password</a></p>
    <p style="color:#666;font-size:13px">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
  </div>`;
  return sendEmail(to, 'Reset your password — The Skill Hearth', html, link);
}
