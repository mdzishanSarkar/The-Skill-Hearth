import api from './api';
import type { SwapSuggestion, Swap } from '../types/social.types';

export async function getSwapSuggestions(): Promise<SwapSuggestion[]> {
  const { data } = await api.get('/swaps/suggestions');
  return (data.data as { suggestions: SwapSuggestion[] }).suggestions;
}

export async function createSwap(
  userBId: string,
  userATeachesSkillId: string,
  userBTeachesSkillId: string,
): Promise<Swap> {
  const { data } = await api.post('/swaps', { userBId, userATeachesSkillId, userBTeachesSkillId });
  return (data.data as { swap: Swap }).swap;
}

export async function acceptSwap(swapId: string): Promise<Swap> {
  const { data } = await api.post(`/swaps/${swapId}/accept`);
  return (data.data as { swap: Swap }).swap;
}

export async function declineSwap(swapId: string): Promise<Swap> {
  const { data } = await api.post(`/swaps/${swapId}/decline`);
  return (data.data as { swap: Swap }).swap;
}

export async function listSwaps(status?: string): Promise<Swap[]> {
  const { data } = await api.get('/swaps', { params: status ? { status } : {} });
  return (data.data as { swaps: Swap[] }).swaps;
}
