import api from './api';
import type {
  Tip,
  CreateTipResult,
  ImpactReport,
} from '../types/billing.types';

interface SessionResult {
  sessionId: string;
  url: string;
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
): Promise<SessionResult> {
  const { data } = await api.post('/billing/promote', { skillId, duration });
  return data.data;
}

export async function getImpactReport(): Promise<ImpactReport> {
  const { data } = await api.get('/billing/impact');
  return data.data;
}
