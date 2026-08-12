import api from './api';
import type {
  Conversation,
  ConversationResult,
  DirectMessage,
  SendDmInput,
} from '../types/dm.types';

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await api.get('/dms/conversations');
  return data.data.conversations;
}

export async function getConversation(userId: string, page = 1, limit = 50): Promise<ConversationResult> {
  const { data } = await api.get(`/dms/${userId}`, { params: { page, limit } });
  return data.data;
}

export async function sendDirectMessage(userId: string, input: SendDmInput): Promise<DirectMessage> {
  const { data } = await api.post(`/dms/${userId}`, input);
  return data.data.message;
}

export async function markConversationRead(userId: string): Promise<void> {
  await api.post(`/dms/${userId}/read`);
}

export async function getUnreadDmCount(): Promise<number> {
  const { data } = await api.get('/dms/unread-count');
  return data.data.count;
}
