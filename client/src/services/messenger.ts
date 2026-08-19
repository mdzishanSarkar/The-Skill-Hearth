import api from './api';
import type { Socket } from 'socket.io-client';
import type {
  ConversationSummary,
  ConversationType,
  ConversationSettingsPatch,
  ConversationSearchResult,
  MediaGalleryResult,
  MessengerMessage,
  MessagePageResult,
  ReactionEmoji,
} from '../types/messenger.types';

export async function getConversations(): Promise<ConversationSummary[]> {
  const { data } = await api.get('/conversations');
  return data.data.conversations;
}

export async function searchConversations(query: string, limit = 20): Promise<ConversationSearchResult> {
  const { data } = await api.get('/conversations/search', { params: { q: query, limit } });
  return data.data;
}

export async function getConversation(
  conversationId: string,
  conversationType: ConversationType,
): Promise<ConversationSummary> {
  const { data } = await api.get(`/conversations/${conversationId}`, { params: { type: conversationType } });
  return data.data;
}

export async function getConversationMessages(
  conversationId: string,
  conversationType: ConversationType,
  cursor?: string,
  limit = 30,
): Promise<MessagePageResult> {
  const { data } = await api.get(`/messenger/${conversationId}`, {
    params: { type: conversationType, cursor, limit },
  });
  return data.data;
}

export async function sendImageMessage(
  conversationId: string,
  conversationType: ConversationType,
  file: File,
  caption?: string,
): Promise<MessengerMessage> {
  const form = new FormData();
  form.append('image', file);
  if (caption) form.append('caption', caption);
  const { data } = await api.post(`/messenger/${conversationId}/image?type=${conversationType}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function getMediaGallery(
  conversationId: string,
  conversationType: ConversationType,
  cursor?: string,
  limit = 20,
): Promise<MediaGalleryResult> {
  const { data } = await api.get(`/messenger/${conversationId}/media`, {
    params: { type: conversationType, cursor, limit },
  });
  return data.data;
}

export async function searchInConversation(
  conversationId: string,
  conversationType: ConversationType,
  query: string,
  limit = 20,
): Promise<MessagePageResult> {
  const { data } = await api.get(`/messenger/${conversationId}/search`, {
    params: { type: conversationType, q: query, limit },
  });
  return data.data;
}

export async function updateConversationSettings(
  conversationId: string,
  conversationType: ConversationType,
  patch: ConversationSettingsPatch,
): Promise<Record<string, unknown>> {
  const { data } = await api.put(`/conversations/${conversationId}/settings`, patch, {
    params: { type: conversationType },
  });
  return data.data;
}

export async function markConversationReadRest(
  conversationId: string,
  conversationType: ConversationType,
  lastReadMessageId?: string,
): Promise<void> {
  await api.put(
    `/conversations/${conversationId}/read`,
    { lastReadMessageId },
    { params: { type: conversationType } },
  );
}

export async function clearHistoryRest(
  conversationId: string,
  conversationType: ConversationType,
): Promise<void> {
  await api.delete(`/conversations/${conversationId}/history`, { params: { type: conversationType } });
}

export async function reportMessage(
  messageId: string,
  reason: string,
  description?: string,
): Promise<void> {
  await api.post(`/messenger/${messageId}/report`, { reason, description });
}

// ── Socket emitters ──────────────────────────────────────────────────────────

export function socketOpenConversation(
  socket: Socket,
  conversationId: string,
  conversationType: ConversationType,
): void {
  socket.emit('messenger:open_conversation', { conversationId, conversationType });
}

export function socketSendMessage(
  socket: Socket,
  params: {
    conversationId: string;
    conversationType: ConversationType;
    content?: string;
    type?: 'text' | 'gif';
    gifUrl?: string;
    gifWidth?: number;
    gifHeight?: number;
    replyToMessageId?: string;
  },
): void {
  socket.emit('messenger:send_message', params);
}

export function socketTypingStart(socket: Socket, conversationId: string, conversationType: ConversationType): void {
  socket.emit('messenger:typing_start', { conversationId, conversationType });
}

export function socketTypingStop(socket: Socket, conversationId: string, conversationType: ConversationType): void {
  socket.emit('messenger:typing_stop', { conversationId, conversationType });
}

export function socketReact(socket: Socket, messageId: string, emoji: ReactionEmoji): void {
  socket.emit('messenger:react', { messageId, emoji });
}

export function socketMarkRead(
  socket: Socket,
  conversationId: string,
  conversationType: ConversationType,
  lastReadMessageId?: string,
): void {
  socket.emit('messenger:mark_read', { conversationId, conversationType, lastReadMessageId });
}

export function socketDeleteMessage(socket: Socket, messageId: string): void {
  socket.emit('messenger:delete_message', { messageId });
}

export function socketUnsendMessage(socket: Socket, messageId: string): void {
  socket.emit('messenger:unsend_message', { messageId });
}

export function socketDeleteConversation(
  socket: Socket,
  conversationId: string,
  conversationType: ConversationType,
): void {
  socket.emit('messenger:delete_conversation', { conversationId, conversationType });
}

export function socketEditMessage(socket: Socket, messageId: string, content: string): void {
  socket.emit('messenger:edit_message', { messageId, content });
}