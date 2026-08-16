import api from './api';
import type { DemandSnapshot } from '../types/demand.types';

export async function getDemandHeatmap(): Promise<DemandSnapshot> {
  const { data } = await api.get('/skill-demand/heatmap');
  return data.data as DemandSnapshot;
}
