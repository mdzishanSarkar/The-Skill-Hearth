import api from './api';
import type {
  Connection,
  ConnectionListResult,
  SendConnectionRequestInput,
} from '../types/connection.types';

export async function sendConnectionRequest(input: SendConnectionRequestInput): Promise<Connection> {
  const { data } = await api.post('/connections', input);
  return data.data;
}

export async function respondToRequest(
  connectionId: string,
  action: 'accepted' | 'rejected',
  responseMessage?: string,
): Promise<Connection> {
  const { data } = await api.patch(`/connections/${connectionId}/respond`, {
    action,
    responseMessage,
  });
  return data.data;
}

export async function withdrawRequest(connectionId: string): Promise<Connection> {
  const { data } = await api.patch(`/connections/${connectionId}/withdraw`);
  return data.data;
}

export async function cancelConnection(connectionId: string, reason?: string): Promise<Connection> {
  const { data } = await api.patch(`/connections/${connectionId}/cancel`, { reason });
  return data.data;
}

export async function markCompleted(connectionId: string): Promise<Connection> {
  const { data } = await api.patch(`/connections/${connectionId}/complete`);
  return data.data;
}

export async function getConnection(connectionId: string): Promise<Connection> {
  const { data } = await api.get(`/connections/${connectionId}`);
  return data.data;
}

export async function getInbox(page = 1, limit = 20): Promise<ConnectionListResult> {
  const { data } = await api.get('/connections/inbox', { params: { page, limit } });
  return data.data;
}

export async function getOutbox(page = 1, limit = 20): Promise<ConnectionListResult> {
  const { data } = await api.get('/connections/outbox', { params: { page, limit } });
  return data.data;
}

export async function getActiveChats(): Promise<Connection[]> {
  const { data } = await api.get('/connections/chats');
  return data.data;
}
