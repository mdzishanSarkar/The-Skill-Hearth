import api from './api';
import type {
  NeighborhoodPage,
  NeighborhoodListItem,
  LearnerRequest,
  LearnerRequestListResult,
  SmartMatch,
} from '../types/discovery.types';

export async function getNeighborhoodPage(city: string, neighborhood?: string): Promise<NeighborhoodPage> {
  const { data } = await api.get('/discover/neighborhood', { params: { city, neighborhood } });
  return data.data as NeighborhoodPage;
}

export async function getNeighborhoodList(): Promise<NeighborhoodListItem[]> {
  const { data } = await api.get('/discover/neighborhoods');
  return (data.data as { neighborhoods: NeighborhoodListItem[] }).neighborhoods;
}

export async function createLearnerRequest(input: {
  skillName: string;
  categoryName: string;
  description?: string;
  city: string;
  neighborhood?: string;
  format?: string;
  availability?: string[];
}): Promise<LearnerRequest> {
  const { data } = await api.post('/discover/learner-requests', input);
  return (data.data as { request: LearnerRequest }).request;
}

export async function listLearnerRequests(
  page = 1,
  limit = 20,
  filters: { city?: string; categoryName?: string; format?: string } = {},
): Promise<LearnerRequestListResult> {
  const { data } = await api.get('/discover/learner-requests', { params: { page, limit, ...filters } });
  return data.data as LearnerRequestListResult;
}

export async function respondToLearnerRequest(requestId: string): Promise<LearnerRequest> {
  const { data } = await api.post(`/discover/learner-requests/${requestId}/respond`);
  return (data.data as { request: LearnerRequest }).request;
}

export async function closeLearnerRequest(requestId: string): Promise<LearnerRequest> {
  const { data } = await api.patch(`/discover/learner-requests/${requestId}/close`);
  return (data.data as { request: LearnerRequest }).request;
}

export async function getSmartMatches(limit = 10): Promise<SmartMatch[]> {
  const { data } = await api.get('/discover/smart-matches', { params: { limit } });
  return (data.data as { matches: SmartMatch[] }).matches;
}
