import api from './api';
import type {
  SubscriptionStatus,
  CheckoutSession,
  PortalSession,
  Tip,
  CreateTipResult,
  ImpactReport,
} from '../types/billing.types';

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const { data } = await api.get('/billing/status');
  return data.data;
}

export async function createCheckoutSession(
  plan: 'monthly' | 'annual',
  successUrl?: string,
  cancelUrl?: string
): Promise<CheckoutSession> {
  const { data } = await api.post('/billing/checkout', { plan, successUrl, cancelUrl });
  return data.data;
}

export async function createPortalSession(returnUrl?: string): Promise<PortalSession> {
  const { data } = await api.post('/billing/portal', { returnUrl });
  return data.data;
}

export async function createTip(
  payeeId: string,
  connectionId: string,
  amount: number
): Promise<CreateTipResult> {
  const { data } = await api.post('/billing/tips', { payeeId, connectionId, amount });
  return data.data;
}

export async function confirmTip(tipId: string): Promise<Tip> {
  const { data } = await api.post(`/billing/tips/${tipId}/confirm`);
  return data.data.tip;
}

export async function promoteSkill(
  skillId: string,
  duration: 7 | 30
): Promise<CheckoutSession> {
  const { data } = await api.post('/billing/promote', { skillId, duration });
  return data.data;
}

export async function getImpactReport(): Promise<ImpactReport> {
  const { data } = await api.get('/billing/impact');
  return data.data;
}
