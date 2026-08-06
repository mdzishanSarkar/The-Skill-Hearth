import api from './api';
import type { Webhook, CreateWebhookInput } from '../types/webhook.types';

export async function createWebhook(input: CreateWebhookInput): Promise<Webhook> {
  const { data } = await api.post('/webhooks', input);
  return data.data.webhook;
}

export async function listWebhooks(): Promise<Webhook[]> {
  const { data } = await api.get('/webhooks');
  return data.data.webhooks;
}

export async function deleteWebhook(id: string): Promise<void> {
  await api.delete(`/webhooks/${id}`);
}

export async function toggleWebhook(id: string): Promise<Webhook> {
  const { data } = await api.put(`/webhooks/${id}/toggle`);
  return data.data.webhook;
}
