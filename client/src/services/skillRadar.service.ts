import api from './api';
import type { RadarIntent, SkillRadarDoc, RadarIntentStatus, ManualRadar } from '../types/radar.types';
import type { SkillWithTeacher } from '../types/skill.types';

export async function getRadar(): Promise<SkillRadarDoc> {
  const { data } = await api.get('/skill-radar');
  return data.data as SkillRadarDoc;
}

export async function getIntents(): Promise<RadarIntent[]> {
  const { data } = await api.get('/skill-radar/intents');
  return (data.data as { intents: RadarIntent[] }).intents;
}

export async function updateIntentStatus(category: string, status: RadarIntentStatus): Promise<RadarIntent[]> {
  const { data } = await api.patch(`/skill-radar/intents/${encodeURIComponent(category)}/status`, { status });
  return (data.data as { intents: RadarIntent[] }).intents;
}

export async function getIntentMatches(category: string, limit = 5): Promise<SkillWithTeacher[]> {
  const { data } = await api.get(`/skill-radar/intents/${encodeURIComponent(category)}/matches`, { params: { limit } });
  return (data.data as { skills: SkillWithTeacher[] }).skills;
}

export async function createManualRadar(
  name: string,
  filters: ManualRadar['filters'],
): Promise<ManualRadar> {
  const { data } = await api.post('/skill-radar/manual', { name, filters });
  return (data.data as { manualRadar: ManualRadar }).manualRadar;
}

export async function deleteManualRadar(id: string): Promise<void> {
  await api.delete(`/skill-radar/manual/${id}`);
}
