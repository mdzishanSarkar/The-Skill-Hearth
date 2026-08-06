import api from './api';
import type {
  GroupSession,
  GroupSessionListResult,
  CreateGroupSessionInput,
} from '../types/groupSession.types';

export async function createSession(input: CreateGroupSessionInput): Promise<GroupSession> {
  const { data } = await api.post('/group-sessions', input);
  return data.data.session;
}

export async function listSessions(params: {
  city?: string;
  category?: string;
  status?: string;
  sessionType?: string;
  sort?: 'new' | 'scheduled';
  page?: number;
  limit?: number;
}): Promise<GroupSessionListResult> {
  const { data } = await api.get('/group-sessions', { params });
  return data.data;
}

export async function getSession(id: string): Promise<GroupSession> {
  const { data } = await api.get(`/group-sessions/${id}`);
  return data.data.session;
}

export async function joinSession(
  id: string,
  message?: string
): Promise<{ session: GroupSession; chatRoomId: string }> {
  const { data } = await api.post(`/group-sessions/${id}/join`, { message });
  return data.data;
}

export async function leaveSession(id: string): Promise<void> {
  await api.delete(`/group-sessions/${id}/leave`);
}

export async function completeSession(id: string): Promise<GroupSession> {
  const { data } = await api.put(`/group-sessions/${id}/complete`);
  return data.data.session;
}

export async function cancelSession(id: string, reason?: string): Promise<GroupSession> {
  const { data } = await api.delete(`/group-sessions/${id}`, { data: { reason } });
  return data.data.session;
}

export async function updateSession(
  id: string,
  input: {
    title?: string;
    description?: string;
    scheduledAt?: string;
    location?: string;
  }
): Promise<GroupSession> {
  const { data } = await api.put(`/group-sessions/${id}`, input);
  return data.data.session;
}
