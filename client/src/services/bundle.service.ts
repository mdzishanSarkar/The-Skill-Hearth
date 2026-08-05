import api from './api';
import type { SkillBundle, SkillBundleListResult } from '../types/social.types';

export async function createBundle(
  name: string,
  description: string,
  skillIds: string[],
): Promise<SkillBundle> {
  const { data } = await api.post('/bundles', { name, description, skillIds });
  return (data.data as { bundle: SkillBundle }).bundle;
}

export async function listBundles(
  page = 1,
  limit = 20,
  sort: 'newest' | 'popular' = 'popular',
): Promise<SkillBundleListResult> {
  const { data } = await api.get('/bundles', { params: { page, limit, sort } });
  return data.data as SkillBundleListResult;
}

export async function getBundle(bundleId: string): Promise<SkillBundle> {
  const { data } = await api.get(`/bundles/${bundleId}`);
  return (data.data as { bundle: SkillBundle }).bundle;
}

export async function voteOnBundle(bundleId: string): Promise<{ votes: number; hasVoted: boolean }> {
  const { data } = await api.post(`/bundles/${bundleId}/vote`);
  return data.data as { votes: number; hasVoted: boolean };
}

export async function deleteBundle(bundleId: string): Promise<void> {
  await api.delete(`/bundles/${bundleId}`);
}
