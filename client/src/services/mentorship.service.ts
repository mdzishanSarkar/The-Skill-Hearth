import api from './api';
import type { Mentorship, CreateMentorshipInput } from '../types/mentorship.types';

export async function requestMentorship(input: CreateMentorshipInput): Promise<Mentorship> {
  const { data } = await api.post('/mentorships', input);
  return data.data.mentorship;
}

export async function respondToMentorship(
  id: string,
  action: 'accept' | 'reject'
): Promise<Mentorship> {
  const { data } = await api.post(`/mentorships/${id}/respond`, { action });
  return data.data.mentorship;
}

export async function addCheckIn(
  id: string,
  notes: string,
  mentorNotes?: string
): Promise<Mentorship> {
  const { data } = await api.post(`/mentorships/${id}/check-in`, { notes, mentorNotes });
  return data.data.mentorship;
}

export async function updateGoal(
  id: string,
  goalIndex: number,
  completed: boolean
): Promise<Mentorship> {
  const { data } = await api.put(`/mentorships/${id}/goal`, { goalIndex, completed });
  return data.data.mentorship;
}

export async function completeMentorship(id: string): Promise<Mentorship> {
  const { data } = await api.post(`/mentorships/${id}/complete`);
  return data.data.mentorship;
}

export async function getMyMentorships(
  as: 'mentor' | 'mentee'
): Promise<Mentorship[]> {
  const { data } = await api.get('/mentorships/my', { params: { as } });
  return data.data.mentorships;
}
