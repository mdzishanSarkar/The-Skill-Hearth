import api from './api';
import type { Endorsement } from '../types/social.types';

export async function endorseSkill(
  endorseeId: string,
  skillId: string,
  connectionId: string,
): Promise<Endorsement> {
  const { data } = await api.post('/endorsements', { endorseeId, skillId, connectionId });
  return (data.data as { endorsement: Endorsement }).endorsement;
}

export async function removeEndorsement(endorsementId: string): Promise<void> {
  await api.delete(`/endorsements/${endorsementId}`);
}

export async function getSkillEndorsements(
  skillId: string,
  page = 1,
  limit = 20,
): Promise<{ endorsements: Endorsement[]; total: number; page: number; totalPages: number }> {
  const { data } = await api.get(`/endorsements/skill/${skillId}`, { params: { page, limit } });
  return data.data as { endorsements: Endorsement[]; total: number; page: number; totalPages: number };
}

export async function getUserEndorsements(userId: string): Promise<Array<{ skill: unknown; count: number; endorsers: unknown[] }>> {
  const { data } = await api.get(`/endorsements/user/${userId}`);
  return (data.data as { endorsements: Array<{ skill: unknown; count: number; endorsers: unknown[] }> }).endorsements;
}

export async function checkEndorsed(endorseeId: string, skillId: string): Promise<boolean> {
  const { data } = await api.get('/endorsements/check', { params: { endorseeId, skillId } });
  return (data.data as { endorsed: boolean }).endorsed;
}
