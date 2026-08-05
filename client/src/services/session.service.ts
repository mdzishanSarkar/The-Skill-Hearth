import api from './api';
import type { SessionNote } from '../types/discovery.types';

export async function proposeSchedule(connectionId: string, proposedAt: string): Promise<{ proposed: boolean; proposedAt: string }> {
  const { data } = await api.post(`/sessions/${connectionId}/schedule/propose`, { proposedAt });
  return data.data as { proposed: boolean; proposedAt: string };
}

export async function confirmSchedule(connectionId: string): Promise<{ confirmed: boolean }> {
  const { data } = await api.post(`/sessions/${connectionId}/schedule/confirm`);
  return data.data as { confirmed: boolean };
}

export async function downloadICS(connectionId: string): Promise<void> {
  const response = await api.get(`/sessions/${connectionId}/schedule/ics`, { responseType: 'blob' });
  const blob = response.data as Blob;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'session.ics';
  a.click();
  URL.revokeObjectURL(url);
}

export async function getSessionNote(connectionId: string): Promise<SessionNote> {
  const { data } = await api.get(`/sessions/${connectionId}/notes`);
  return (data.data as { note: SessionNote }).note;
}

export async function updateSessionNote(connectionId: string, content: string): Promise<SessionNote> {
  const { data } = await api.put(`/sessions/${connectionId}/notes`, { content });
  return (data.data as { note: SessionNote }).note;
}

export async function reportNoShow(connectionId: string, reason?: string): Promise<{ reported: boolean }> {
  const { data } = await api.post(`/sessions/${connectionId}/no-show`, { reason });
  return data.data as { reported: boolean };
}
