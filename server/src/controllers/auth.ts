import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import * as authService from '../services/auth';
import { AuthRequest } from '../middleware/auth';

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: REFRESH_TTL_MS,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, username, displayName, bio, adminCode } = req.body || {};
  const data = await authService.register({ email, password, username, displayName, bio, adminCode });
  res.status(201).json({ success: true, data });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const data = await authService.verifyEmail(String(req.params.token));
  res.json({ success: true, data });
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const data = await authService.resendVerification(req.body?.email);
  res.json({ success: true, data });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  const data = await authService.login({ email, password, ip: req.ip });
  setRefreshCookie(res, data.refreshToken);
  res.json({ success: true, data: { user: data.user, accessToken: data.accessToken } });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
  const data = await authService.refresh(token);
  setRefreshCookie(res, data.refreshToken);
  res.json({ success: true, data: { user: data.user, accessToken: data.accessToken } });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
  await authService.logout(token, accessToken);
  clearRefreshCookie(res);
  res.json({ success: true, data: { message: 'Signed out' } });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const data = await authService.forgotPassword(req.body?.email);
  res.json({ success: true, data });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body || {};
  const data = await authService.resetPassword(token, newPassword);
  res.json({ success: true, data });
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await authService.getAuthUser(req.userId!);
  res.json({ success: true, data: { user: data } });
});
