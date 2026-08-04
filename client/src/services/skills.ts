import api from './api';
import type {
  Category,
  SkillInput,
  SkillListParams,
  SkillListResult,
  SkillWithTeacher,
} from '../types/skill.types';

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get('/skills/categories');
  return (data.data as { categories: Category[] }).categories;
}

export async function createSkill(input: SkillInput): Promise<SkillWithTeacher> {
  const { data } = await api.post('/skills', input);
  return (data.data as { skill: SkillWithTeacher }).skill;
}

export async function listMySkills(
  params: { type?: 'teach' | 'learn'; page?: number; limit?: number } = {}
): Promise<SkillListResult> {
  const { data } = await api.get('/skills/mine', { params });
  return data.data as SkillListResult;
}

export async function getSkill(id: string): Promise<SkillWithTeacher> {
  const { data } = await api.get(`/skills/${id}`);
  return (data.data as { skill: SkillWithTeacher }).skill;
}

export async function updateSkill(id: string, input: Partial<SkillInput>): Promise<SkillWithTeacher> {
  const { data } = await api.put(`/skills/${id}`, input);
  return (data.data as { skill: SkillWithTeacher }).skill;
}

export async function deleteSkill(id: string): Promise<void> {
  await api.delete(`/skills/${id}`);
}

export async function toggleSkill(id: string, isActive: boolean): Promise<SkillWithTeacher> {
  const { data } = await api.patch(`/skills/${id}/toggle`, { isActive });
  return (data.data as { skill: SkillWithTeacher }).skill;
}

export async function listSkills(params: SkillListParams = {}): Promise<SkillListResult> {
  const { data } = await api.get('/skills', { params });
  return data.data as SkillListResult;
}
