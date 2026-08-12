import api from './api';
import type { ImpactData } from '../types/impact.types';

export async function getMyImpact(): Promise<ImpactData> {
  const { data } = await api.get('/users/me/impact');
  return data.data.impact;
}
