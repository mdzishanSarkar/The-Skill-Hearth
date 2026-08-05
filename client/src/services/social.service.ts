import api from './api';
import type { OAuthProviderInfo, TwoFactorStatus, TwoFactorSetup, ProfileCompleteness } from '../types/social.types';

export async function getGoogleAuthUrl(): Promise<string> {
  const { data } = await api.get('/oauth/google/url');
  return (data.data as { url: string }).url;
}

export async function getAppleAuthUrl(): Promise<string> {
  const { data } = await api.get('/oauth/apple/url');
  return (data.data as { url: string }).url;
}

export async function getLinkedProviders(): Promise<OAuthProviderInfo[]> {
  const { data } = await api.get('/oauth/providers');
  return (data.data as { providers: OAuthProviderInfo[] }).providers;
}

export async function unlinkProvider(provider: 'google' | 'apple'): Promise<void> {
  await api.delete(`/oauth/providers/${provider}`);
}

export async function setupTwoFactor(): Promise<TwoFactorSetup> {
  const { data } = await api.post('/oauth/2fa/setup');
  return data.data as TwoFactorSetup;
}

export async function verifyAndEnableTwoFactor(token: string): Promise<{ enabled: boolean }> {
  const { data } = await api.post('/oauth/2fa/verify', { token });
  return data.data as { enabled: boolean };
}

export async function verifyTwoFactor(token: string, userId: string): Promise<{ valid: boolean }> {
  const { data } = await api.post('/oauth/2fa/validate', { token, userId });
  return data.data as { valid: boolean };
}

export async function disableTwoFactor(token: string): Promise<{ disabled: boolean }> {
  const { data } = await api.post('/oauth/2fa/disable', { token });
  return data.data as { disabled: boolean };
}

export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
  const { data } = await api.get('/oauth/2fa/status');
  return data.data as TwoFactorStatus;
}

export async function getProfileCompleteness(): Promise<ProfileCompleteness> {
  const { data } = await api.get('/users/me/completeness');
  return data.data as ProfileCompleteness;
}

export async function exportAccountData(): Promise<Blob> {
  const response = await api.get('/users/me/export', { responseType: 'blob' });
  return response.data as Blob;
}

export async function deleteAccount(): Promise<void> {
  await api.delete('/users/me');
}
