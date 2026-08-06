import api from './api';
import type {
  Showcase,
  ShowcaseListResult,
  CreateShowcaseInput,
  LikeResult,
} from '../types/showcase.types';

export async function createShowcase(input: CreateShowcaseInput): Promise<Showcase> {
  const { data } = await api.post('/showcase', input);
  return data.data.showcase;
}

export async function listShowcases(
  params: { userId?: string; page?: number; limit?: number } = {}
): Promise<ShowcaseListResult> {
  const { data } = await api.get('/showcase', { params });
  return data.data;
}

export async function getShowcase(id: string): Promise<Showcase> {
  const { data } = await api.get(`/showcase/${id}`);
  return data.data.showcase;
}

export async function likeShowcase(id: string): Promise<LikeResult> {
  const { data } = await api.post(`/showcase/${id}/like`);
  return data.data;
}

export async function deleteShowcase(id: string): Promise<void> {
  await api.delete(`/showcase/${id}`);
}
