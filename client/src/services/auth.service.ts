import api from './api';
import {
  setAccessToken,
  clearAccessToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
  clearStoredRefreshToken,
} from './tokenStore';
import type { RegisterInput, User } from '../types/user.types';

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface RegisterResult {
  user: User;
}

export async function register(input: RegisterInput): Promise<RegisterResult> {
  const { data } = await api.post('/auth/register', input);
  return data.data as RegisterResult;
}

export async function verifyEmail(token: string): Promise<User> {
  const { data } = await api.post(`/auth/verify-email/${token}`);
  return (data.data as { user: User }).user;
}

export async function resendVerification(email: string): Promise<void> {
  await api.post('/auth/resend-verification', { email });
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const { data } = await api.post('/auth/login', { email, password });
  const result = data.data as AuthResult;
  setAccessToken(result.accessToken);
  clearStoredRefreshToken();
  return result;
}

export async function refreshSession(): Promise<AuthResult> {
  const { data } = await api.post('/auth/refresh', {
    refreshToken: getStoredRefreshToken() ?? undefined,
  });
  const result = data.data as AuthResult;
  setAccessToken(result.accessToken);
  if (result.refreshToken) setStoredRefreshToken(result.refreshToken);
  return result;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    clearAccessToken();
    clearStoredRefreshToken();
  }
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean }> {
  const { data } = await api.post('/auth/reset-password', { token, newPassword });
  return data.data as { success: boolean };
}
