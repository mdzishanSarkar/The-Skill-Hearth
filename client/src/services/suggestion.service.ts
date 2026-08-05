import api from './api';
import type { SkillSuggestion, SkillSuggestionListResult } from '../types/social.types';

export async function submitSuggestion(
  skillName: string,
  categoryName: string,
  description: string,
): Promise<SkillSuggestion> {
  const { data } = await api.post('/suggestions', { skillName, categoryName, description });
  return (data.data as { suggestion: SkillSuggestion }).suggestion;
}

export async function voteOnSuggestion(suggestionId: string): Promise<{ votes: number; hasVoted: boolean }> {
  const { data } = await api.post(`/suggestions/${suggestionId}/vote`);
  return data.data as { votes: number; hasVoted: boolean };
}

export async function listPendingSuggestions(
  page = 1,
  limit = 20,
): Promise<SkillSuggestionListResult> {
  const { data } = await api.get('/suggestions/pending', { params: { page, limit } });
  return data.data as SkillSuggestionListResult;
}

export async function listAllSuggestions(
  page = 1,
  limit = 20,
  status?: string,
): Promise<SkillSuggestionListResult> {
  const { data } = await api.get('/suggestions', { params: { page, limit, status } });
  return data.data as SkillSuggestionListResult;
}

export async function approveSuggestion(
  suggestionId: string,
  adminNotes?: string,
): Promise<SkillSuggestion> {
  const { data } = await api.patch(`/suggestions/${suggestionId}/approve`, { adminNotes });
  return (data.data as { suggestion: SkillSuggestion }).suggestion;
}

export async function rejectSuggestion(
  suggestionId: string,
  adminNotes?: string,
): Promise<SkillSuggestion> {
  const { data } = await api.patch(`/suggestions/${suggestionId}/reject`, { adminNotes });
  return (data.data as { suggestion: SkillSuggestion }).suggestion;
}
