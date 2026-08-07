import axios from 'axios';
import { OAuthProvider, User } from '../models';
import type { IOAuthProvider } from '../models';
import { HttpError } from '../utils/errors';
import { sanitizeUser } from './auth';
import { generateTokenId, signAccessToken, signRefreshToken } from '../utils/jwt';
import { RefreshToken } from '../models';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/oauth/google/callback';
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || '';
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || '';
const APPLE_KEY_ID = process.env.APPLE_KEY_ID || '';
const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY || '';
const APPLE_REDIRECT_URI = process.env.APPLE_REDIRECT_URI || 'http://localhost:5000/api/oauth/apple/callback';

interface OAuthUserInfo {
  providerUserId: string;
  email: string;
  displayName: string;
  avatar: string;
}

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function handleGoogleCallback(code: string): Promise<{ user: Record<string, unknown>; accessToken: string; refreshToken: string; isNewUser: boolean }> {
  const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const { id_token } = tokenResponse.data;
  const payload = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString());

  const userInfo: OAuthUserInfo = {
    providerUserId: payload.sub,
    email: payload.email || '',
    displayName: payload.name || '',
    avatar: payload.picture || '',
  };

  return handleOAuthLogin('google', userInfo);
}

export function getAppleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: APPLE_CLIENT_ID,
    redirect_uri: APPLE_REDIRECT_URI,
    response_type: 'code id_token',
    scope: 'name email',
    response_mode: 'form_post',
  });
  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
}

export async function handleAppleCallback(
  code: string,
  idToken: string,
  user?: { name?: string | { firstName?: string; lastName?: string }; email?: string },
): Promise<{ user: Record<string, unknown>; accessToken: string; refreshToken: string; isNewUser: boolean }> {
  const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());

  const name = user?.name;
  const displayName =
    typeof name === 'string'
      ? name
      : [name?.firstName, name?.lastName].filter(Boolean).join(' ');

  const userInfo: OAuthUserInfo = {
    providerUserId: payload.sub,
    email: user?.email || payload.email || '',
    displayName,
    avatar: '',
  };

  return handleOAuthLogin('apple', userInfo);
}

async function handleOAuthLogin(
  provider: 'google' | 'apple',
  userInfo: OAuthUserInfo,
): Promise<{ user: Record<string, unknown>; accessToken: string; refreshToken: string; isNewUser: boolean }> {
  let isNewUser = false;

  let oauthRecord = await OAuthProvider.findOne({
    provider,
    providerUserId: userInfo.providerUserId,
  });

  if (oauthRecord) {
    oauthRecord.email = userInfo.email;
    oauthRecord.displayName = userInfo.displayName;
    oauthRecord.avatar = userInfo.avatar;
    await oauthRecord.save();
  } else {
    let user = await User.findOne({ email: userInfo.email });

    if (!user) {
      const displayName = userInfo.displayName || userInfo.email.split('@')[0];
      user = await User.create({
        email: userInfo.email,
        passwordHash: require('crypto').randomBytes(32).toString('hex'),
        displayName,
        avatar: userInfo.avatar,
        isEmailVerified: true,
        hasCompletedOnboarding: false,
      });
      isNewUser = true;
    }

    oauthRecord = await OAuthProvider.create({
      userId: user._id,
      provider,
      providerUserId: userInfo.providerUserId,
      email: userInfo.email,
      displayName: userInfo.displayName,
      avatar: userInfo.avatar,
    });
  }

  const user = await User.findById(oauthRecord.userId);
  if (!user) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'User not found after OAuth');
  }

  user.lastActive = new Date();
  await user.save();

  const tokenId = generateTokenId();
  const accessToken = signAccessToken(String(user._id), tokenId);
  const refreshToken = signRefreshToken(String(user._id), tokenId);

  const tokenHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');
  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
    isNewUser,
  };
}

export async function getLinkedProviders(userId: string) {
  const providers = await OAuthProvider.find({ userId }).select('-__v').lean();
  return providers.map((p) => ({
    provider: p.provider,
    email: p.email,
    displayName: p.displayName,
    linkedAt: p.createdAt,
  }));
}

export async function unlinkProvider(userId: string, provider: 'google' | 'apple') {
  const count = await OAuthProvider.countDocuments({ userId });
  if (count <= 1) {
    const user = await User.findById(userId).select('passwordHash');
    if (!user || !user.passwordHash) {
      throw new HttpError(400, 'CANNOT_UNLINK', 'Cannot unlink your only login method. Set a password first.');
    }
  }

  const result = await OAuthProvider.deleteOne({ userId, provider });
  if (result.deletedCount === 0) {
    throw new HttpError(404, 'PROVIDER_NOT_FOUND', 'Provider not linked');
  }
}
