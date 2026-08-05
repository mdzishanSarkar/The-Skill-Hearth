import {
  User,
  EmailVerificationToken,
  PasswordResetToken,
  RefreshToken,
} from '../models';
import type { IUser } from '../models';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
  generateTokenId,
} from '../utils/jwt';
import { generateToken, hashToken } from '../utils/token';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { HttpError } from '../utils/errors';
import { blacklistToken, ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from '../utils/blacklist';
import {
  clearLoginFailures,
  isLoginLocked,
  recordLoginFailure,
} from '../utils/loginAttempts';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

export function sanitizeUser(user: IUser): Record<string, unknown> {
  const json = user.toJSON() as Record<string, unknown>;
  delete json.passwordHash;
  json.hasCompletedOnboarding = user.hasCompletedOnboarding !== false;
  return json;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  bio?: string;
  adminCode?: string;
}

export async function register(input: RegisterInput) {
  const email = input.email.toLowerCase().trim();
  const displayName = input.displayName.trim();

  if (!EMAIL_REGEX.test(email)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid email format');
  }
  if (input.password.length < PASSWORD_MIN || input.password.length > PASSWORD_MAX) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters`
    );
  }
  if (displayName.length < 2 || displayName.length > 50) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Display name must be between 2 and 50 characters');
  }

  let role: 'user' | 'admin' = 'user';
  if (input.adminCode) {
    if (!process.env.ADMIN_SIGNUP_CODE || input.adminCode !== process.env.ADMIN_SIGNUP_CODE) {
      throw new HttpError(403, 'INVALID_ADMIN_CODE', 'The admin signup code is incorrect');
    }
    role = 'admin';
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new HttpError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
  }

  const nameTaken = await User.findOne({ displayName });
  if (nameTaken) {
    throw new HttpError(409, 'NAME_TAKEN', 'That display name is already taken');
  }

  const user = await User.create({
    email,
    passwordHash: input.password,
    displayName,
    bio: input.bio?.trim() || '',
    role,
    hasCompletedOnboarding: false,
  });

  const token = generateToken();
  await EmailVerificationToken.create({
    userId: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
  });

  await sendVerificationEmail(user.email, token);

  return { user: sanitizeUser(user) };
}

export async function verifyEmail(token: string) {
  if (!token) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Verification token is required');
  }

  const record = await EmailVerificationToken.findOne({
    tokenHash: hashToken(token),
    isUsed: false,
  });
  if (!record) {
    throw new HttpError(400, 'TOKEN_INVALID', 'Invalid or expired verification token');
  }
  if (record.expiresAt < new Date()) {
    throw new HttpError(400, 'TOKEN_EXPIRED', 'Verification token has expired');
  }

  const user = await User.findById(record.userId);
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  user.isEmailVerified = true;
  await user.save();

  record.isUsed = true;
  await record.save();

  return { user: sanitizeUser(user) };
}

export async function resendVerification(email: string) {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'A valid email is required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (user && !user.isEmailVerified) {
    const token = generateToken();
    await EmailVerificationToken.create({
      userId: user._id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    });

    await sendVerificationEmail(user.email, token);
  }

  return { message: 'If the account exists and is unverified, a new verification email has been sent' };
}

export interface LoginInput {
  email: string;
  password: string;
  ip?: string;
}

export async function login({ email, password, ip }: LoginInput) {
  const emailNorm = email.toLowerCase().trim();
  if (!emailNorm || !password) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Email and password are required');
  }

  if (await isLoginLocked(emailNorm, ip)) {
    throw new HttpError(
      429,
      'ACCOUNT_LOCKED',
      'Too many failed attempts. Try again in 15 minutes.'
    );
  }

  const user = await User.findOne({ email: emailNorm });
  if (!user) {
    await recordLoginFailure(emailNorm, ip);
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  if (user.status === 'banned') {
    throw new HttpError(403, 'ACCOUNT_BANNED', 'This account has been banned');
  }
  if (user.status === 'suspended') {
    throw new HttpError(403, 'ACCOUNT_SUSPENDED', 'This account is suspended');
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    await recordLoginFailure(emailNorm, ip);
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  await clearLoginFailures(emailNorm, ip);

  if (!user.isEmailVerified) {
    throw new HttpError(
      403,
      'EMAIL_NOT_VERIFIED',
      'Please verify your email before signing in'
    );
  }

  user.lastActive = new Date();
  await user.save();

  return issueTokenPair(user);
}

async function issueTokenPair(user: IUser) {
  const tokenId = generateTokenId();
  const userId = user._id.toString();
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId, tokenId);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });

  return { user: sanitizeUser(user), accessToken, refreshToken };
}

export async function refresh(refreshToken: string | undefined) {
  if (!refreshToken) {
    throw new HttpError(401, 'NO_REFRESH_TOKEN', 'No refresh token provided');
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new HttpError(401, 'TOKEN_INVALID', 'Invalid or expired refresh token');
  }

  const stored = await RefreshToken.findOne({
    tokenHash: hashToken(refreshToken),
    revokedAt: null,
  });
  if (!stored) {
    throw new HttpError(401, 'TOKEN_INVALID', 'Invalid or expired refresh token');
  }
  if (stored.expiresAt < new Date()) {
    throw new HttpError(401, 'TOKEN_EXPIRED', 'Refresh token has expired');
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    throw new HttpError(401, 'USER_NOT_FOUND', 'User not found');
  }

  if (user.status === 'suspended' && user.suspensionExpiresAt && user.suspensionExpiresAt <= new Date()) {
    user.status = 'active';
    user.suspensionExpiresAt = undefined;
  }
  if (user.status === 'banned') {
    throw new HttpError(403, 'ACCOUNT_BANNED', 'Your account has been banned');
  }
  if (user.status === 'suspended') {
    throw new HttpError(403, 'ACCOUNT_SUSPENDED', 'Your account is suspended');
  }

  stored.revokedAt = new Date();
  await stored.save();

  user.lastActive = new Date();
  await user.save();

  return issueTokenPair(user);
}

export async function logout(refreshToken: string | undefined, accessToken?: string) {
  if (refreshToken) {
    const payload = verifyRefreshToken(refreshToken);
    if (payload) {
      await blacklistToken(payload.tokenId, 'refresh', REFRESH_TOKEN_TTL_SECONDS);
    }
    await RefreshToken.updateOne(
      { tokenHash: hashToken(refreshToken), revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }

  if (accessToken) {
    const payload = verifyAccessToken(accessToken);
    if (payload) {
      await blacklistToken(payload.tokenId, 'access', ACCESS_TOKEN_TTL_SECONDS);
    }
  }
}

export async function forgotPassword(email: string) {
  const emailNorm = email.toLowerCase().trim();
  if (!emailNorm || !EMAIL_REGEX.test(emailNorm)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'A valid email is required');
  }

  const user = await User.findOne({ email: emailNorm });
  if (user) {
    const token = generateToken();
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    });

    await sendPasswordResetEmail(user.email, token);
  }

  return { message: 'If an account exists for that email, a reset link has been sent' };
}

export async function resetPassword(token: string, newPassword: string) {
  if (!token) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Reset token is required');
  }
  if (!newPassword || newPassword.length < PASSWORD_MIN || newPassword.length > PASSWORD_MAX) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      `Password must be between ${PASSWORD_MIN} and ${PASSWORD_MAX} characters`
    );
  }

  const record = await PasswordResetToken.findOne({
    tokenHash: hashToken(token),
    isUsed: false,
  });
  if (!record) {
    throw new HttpError(400, 'TOKEN_INVALID', 'Invalid or expired reset token');
  }
  if (record.expiresAt < new Date()) {
    throw new HttpError(400, 'TOKEN_EXPIRED', 'Reset token has expired');
  }

  const user = await User.findById(record.userId);
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  user.passwordHash = newPassword;
  user.isEmailVerified = true;
  await user.save();

  record.isUsed = true;
  await record.save();

  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  return { success: true };
}

export async function getAuthUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return sanitizeUser(user);
}
