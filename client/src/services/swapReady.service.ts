import api from './api';
import type { SwapReadyMatch } from '../types/swapReady.types';

export async function getSwapReadyMatches(limit = 50): Promise<SwapReadyMatch[]> {
  const { data } = await api.get('/swap-ready-matches', { params: { limit } });
  return (data.data as { matches: SwapReadyMatch[] }).matches;
}

export async function proposeSwapReadyMatch(matchId: string): Promise<void> {
  await api.post(`/swap-ready-matches/${matchId}/propose`);
}

export async function hideSwapReadyMatch(matchId: string): Promise<void> {
  await api.patch(`/swap-ready-matches/${matchId}/hide`);
}
