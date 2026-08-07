import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as oauthService from '../services/oauth';
import * as twoFactorService from '../services/twoFactor';
import { asyncHandler } from '../utils/errors';
import { setRefreshCookie } from './auth';

export const getGoogleAuthUrl = asyncHandler(async (req: AuthRequest, res: Response) => {
  const url = oauthService.getGoogleAuthUrl();
  res.json({ success: true, data: { url } });
});

export const googleCallback = asyncHandler(async (req: AuthRequest, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).json({ success: false, error: { code: 'MISSING_CODE', message: 'Authorization code is required' } });
    return;
  }

  const result = await oauthService.handleGoogleCallback(code);
  setRefreshCookie(res, result.refreshToken);

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const isNewUser = result.isNewUser ? '1' : '0';
  res.redirect(`${clientUrl}/auth/callback?token=${encodeURIComponent(result.accessToken)}&newUser=${isNewUser}`);
});

export const getAppleAuthUrl = asyncHandler(async (req: AuthRequest, res: Response) => {
  const url = oauthService.getAppleAuthUrl();
  res.json({ success: true, data: { url } });
});

export const appleCallback = asyncHandler(async (req: AuthRequest, res: Response) => {
  const code = req.body.code as string;
  const idToken = req.body.id_token as string;
  const user = req.body.user ? JSON.parse(req.body.user) : undefined;

  if (!code || !idToken) {
    res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS', message: 'Code and ID token are required' } });
    return;
  }

  const result = await oauthService.handleAppleCallback(code, idToken, user);
  setRefreshCookie(res, result.refreshToken);
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const isNewUser = result.isNewUser ? '1' : '0';
  res.redirect(`${clientUrl}/auth/callback?token=${encodeURIComponent(result.accessToken)}&newUser=${isNewUser}`);
});

export const getLinkedProviders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const providers = await oauthService.getLinkedProviders(req.userId!);
  res.json({ success: true, data: { providers } });
});

export const unlinkProvider = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { provider } = req.params;
  if (provider !== 'google' && provider !== 'apple') {
    res.status(400).json({ success: false, error: { code: 'INVALID_PROVIDER', message: 'Provider must be google or apple' } });
    return;
  }
  await oauthService.unlinkProvider(req.userId!, provider);
  res.json({ success: true });
});

export const setupTwoFactor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await twoFactorService.generateTwoFactorSecret(req.userId!);
  res.json({ success: true, data: result });
});

export const verifyAndEnableTwoFactor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ success: false, error: { code: 'MISSING_TOKEN', message: 'Verification code is required' } });
    return;
  }
  const result = await twoFactorService.verifyAndEnableTwoFactor(req.userId!, token);
  res.json({ success: true, data: result });
});

export const verifyTwoFactor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token, userId } = req.body;
  if (!token || !userId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS', message: 'Token and userId are required' } });
    return;
  }
  const isValid = await twoFactorService.verifyTwoFactorToken(userId, token);
  res.json({ success: true, data: { valid: isValid } });
});

export const disableTwoFactor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ success: false, error: { code: 'MISSING_TOKEN', message: 'Verification code is required' } });
    return;
  }
  const result = await twoFactorService.disableTwoFactor(req.userId!, token);
  res.json({ success: true, data: result });
});

export const getTwoFactorStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const status = await twoFactorService.getTwoFactorStatus(req.userId!);
  res.json({ success: true, data: status });
});
