import api from './api';
import type { FeedEvent, FeedListResult } from '../types/feed.types';

export async function getFeed(page = 1, limit = 20): Promise<FeedListResult> {
  const { data } = await api.get('/feed', { params: { page, limit } });
  return data.data;
}

export async function getUserFeed(userId: string, page = 1, limit = 20): Promise<FeedListResult> {
  const { data } = await api.get(`/feed/user/${userId}`, { params: { page, limit } });
  return data.data;
}

export async function reactToEvent(eventId: string, emoji: string): Promise<FeedEvent> {
  const { data } = await api.post(`/feed/${eventId}/react`, { emoji });
  return data.data.event;
}
