import api from './api';
import type { InboxConversationListResult, InboxFilter } from '../types/inbox.types';

export async function getInboxConversations(
  page = 1,
  limit = 20,
  filter: InboxFilter = 'all',
): Promise<InboxConversationListResult> {
  const { data } = await api.get('/messages/conversations', {
    params: { page, limit, filter },
  });
  return data.data;
}

export async function setInboxPreference(
  connectionId: string,
  action: 'pin' | 'unpin' | 'mute' | 'unmute' | 'archive' | 'unarchive',
  muteDuration?: number,
): Promise<{ _id: string; connectionId: string; isPinned?: boolean; isMuted?: boolean; isArchived?: boolean }> {
  const { data } = await api.put(`/messages/conversations/${connectionId}/preference`, {
    action,
    muteDuration,
  });
  return data.data;
}
