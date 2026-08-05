import api from './api';
import type { ChatMessage, MessageListResult, MessageSearchResult } from '../types/message.types';

export async function sendMessage(connectionId: string, content: string): Promise<ChatMessage> {
  const { data } = await api.post('/messages', { connectionId, content });
  return data.data;
}

export async function getMessages(
  connectionId: string,
  page = 1,
  limit = 50,
): Promise<MessageListResult> {
  const { data } = await api.get(`/messages/${connectionId}`, { params: { page, limit } });
  return data.data;
}

export async function markAsRead(connectionId: string): Promise<void> {
  await api.patch(`/messages/${connectionId}/read`);
}

export async function markAsDelivered(messageId: string): Promise<void> {
  await api.patch(`/messages/${messageId}/deliver`);
}

export async function getUnreadMessageCount(): Promise<number> {
  const { data } = await api.get('/messages/unread');
  return data.data.count;
}

export async function sendImageMessage(
  connectionId: string,
  file: File,
  caption?: string,
): Promise<ChatMessage> {
  const form = new FormData();
  form.append('image', file);
  if (caption) form.append('caption', caption);
  const { data } = await api.post(`/chat/${connectionId}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function addReaction(messageId: string, emoji: string): Promise<ChatMessage> {
  const { data } = await api.post(`/chat/${messageId}/reactions`, { emoji });
  return data.data;
}

export async function searchMessages(
  connectionId: string,
  query: string,
  page = 1,
  limit = 20,
): Promise<MessageSearchResult> {
  const { data } = await api.get(`/chat/${connectionId}/search`, { params: { q: query, page, limit } });
  return data.data;
}
