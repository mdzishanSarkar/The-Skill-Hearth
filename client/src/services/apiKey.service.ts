import api from './api';
import type { ApiKey, CreateApiKeyInput, PlatformStats } from '../types/apiKey.types';

export async function createApiKey(input: CreateApiKeyInput): Promise<ApiKey> {
  const { data } = await api.post('/integrations/keys', input);
  return data.data.apiKey;
}

export async function listApiKeys(): Promise<ApiKey[]> {
  const { data } = await api.get('/integrations/keys');
  return data.data.apiKeys;
}

export async function revokeApiKey(id: string): Promise<ApiKey> {
  const { data } = await api.delete(`/integrations/keys/${id}`);
  return data.data.apiKey;
}

export async function getPublicStats(): Promise<PlatformStats> {
  const { data } = await api.get('/integrations/stats');
  return data.data;
}
