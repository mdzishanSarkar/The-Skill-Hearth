import api from './api';
import {
  setAccessToken,
  clearAccessToken,
} from './tokenStore';
import type { RegisterInput, User } from '../types/user.types';

export interface AuthResult {
  user: User;
  accessToken: string;
}

export async function register(input: RegisterInput): Promise<void> {
  const form = new FormData();
  form.append('email', input.email);
  form.append('password', input.password);
  form.append('username', input.username);
  form.append('displayName', input.displayName);
  form.append('identityIdType', input.identityIdType);
  form.append('identity', input.identityFile);
  if (input.bio) form.append('bio', input.bio);
  if (input.adminCode) form.append('adminCode', input.adminCode);
  await api.post('/auth/register', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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
  return result;
}

export async function refreshSession(): Promise<AuthResult> {
  const { data } = await api.post('/auth/refresh');
  const result = data.data as AuthResult;
  setAccessToken(result.accessToken);
  return result;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    clearAccessToken();
  }
}

export async function getAuthUser(): Promise<User> {
  const { data } = await api.get('/auth/me');
  return (data.data as { user: User }).user;
}

export async function submitIdentity(
  idType: 'nid' | 'student_id' | 'passport',
  identityFile: File
): Promise<User> {
  const form = new FormData();
  form.append('idType', idType);
  form.append('identity', identityFile);
  const { data } = await api.patch('/auth/identity', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return (data.data as { user: User }).user;
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
