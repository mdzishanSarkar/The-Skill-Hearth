import api from './api';
import type { SavedSearchItem } from '../types/discovery.types';
import type { SkillListResult } from '../types/skill.types';

export async function saveSearch(
  name: string,
  filters: SavedSearchItem['filters'],
  alertEnabled = false,
): Promise<SavedSearchItem> {
  const { data } = await api.post('/saved-searches', { name, filters, alertEnabled });
  return (data.data as { search: SavedSearchItem }).search;
}

export async function listSavedSearches(): Promise<SavedSearchItem[]> {
  const { data } = await api.get('/saved-searches');
  return (data.data as { searches: SavedSearchItem[] }).searches;
}

export async function getSearchMatches(
  searchId: string,
  opts?: { page?: number; limit?: number },
): Promise<SkillListResult> {
  const { data } = await api.get(`/saved-searches/${searchId}/matches`, { params: opts });
  return data.data as SkillListResult;
}

export async function updateSavedSearch(
  searchId: string,
  updates: { name?: string; alertEnabled?: boolean },
): Promise<SavedSearchItem> {
  const { data } = await api.patch(`/saved-searches/${searchId}`, updates);
  return (data.data as { search: SavedSearchItem }).search;
}

export async function deleteSavedSearch(searchId: string): Promise<void> {
  await api.delete(`/saved-searches/${searchId}`);
}
