import { generate, verify, generateSecret, generateURI } from 'otplib';
import QRCode from 'qrcode';
import { TwoFactorSecret, User } from '../models';
import { HttpError } from '../utils/errors';

const APP_NAME = process.env.APP_NAME || 'SkillHearth';

export async function generateTwoFactorSecret(userId: string) {
  const secret = generateSecret();
  const otpauthUrl = generateURI({ issuer: APP_NAME, label: userId, secret });

  let record = await TwoFactorSecret.findOne({ userId });
  if (record) {
    record.secret = secret;
    record.enabled = false;
    await record.save();
  } else {
    record = await TwoFactorSecret.create({ userId, secret, enabled: false });
  }

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return { secret, qrCodeDataUrl, otpauthUrl };
}

export async function verifyAndEnableTwoFactor(userId: string, token: string) {
  const record = await TwoFactorSecret.findOne({ userId });
  if (!record) {
    throw new HttpError(400, '2FA_NOT_SETUP', 'Two-factor authentication has not been initiated');
  }

  const isValid = verify({ token, secret: record.secret });
  if (!isValid) {
    throw new HttpError(400, 'INVALID_TOKEN', 'Invalid verification code');
  }

  record.enabled = true;
  record.lastUsedAt = new Date();
  await record.save();

  return { enabled: true };
}

export async function verifyTwoFactorToken(userId: string, token: string): Promise<boolean> {
  const record = await TwoFactorSecret.findOne({ userId, enabled: true });
  if (!record) return true;

  const isValid = verify({ token, secret: record.secret });
  if (!isValid) return false;

  record.lastUsedAt = new Date();
  await record.save();

  return true;
}

export async function disableTwoFactor(userId: string, token: string) {
  const record = await TwoFactorSecret.findOne({ userId, enabled: true });
  if (!record) {
    throw new HttpError(400, '2FA_NOT_ENABLED', 'Two-factor authentication is not enabled');
  }

  const isValid = verify({ token, secret: record.secret });
  if (!isValid) {
    throw new HttpError(400, 'INVALID_TOKEN', 'Invalid verification code');
  }

  await TwoFactorSecret.deleteOne({ userId });
  return { disabled: true };
}

export async function getTwoFactorStatus(userId: string) {
  const record = await TwoFactorSecret.findOne({ userId }).select('-secret -__v').lean();
  return {
    enabled: record?.enabled ?? false,
    lastUsedAt: record?.lastUsedAt ?? null,
  };
}
