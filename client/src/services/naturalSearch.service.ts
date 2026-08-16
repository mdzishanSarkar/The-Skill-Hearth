import api from './api';
import type { NaturalSearchResult } from '../types/search.types';

export async function searchNatural(query: string): Promise<NaturalSearchResult> {
  const { data } = await api.post('/search/natural', { query });
  return data.data as NaturalSearchResult;
}
