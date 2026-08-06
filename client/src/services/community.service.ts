import api from './api';
import type {
  CommunityPost,
  CommunityPostListResult,
  CreateCommunityPostInput,
  VoteResult,
} from '../types/community.types';

export async function createPost(input: CreateCommunityPostInput): Promise<CommunityPost> {
  const { data } = await api.post('/community', input);
  return data.data.post;
}

export async function listPosts(
  city: string,
  neighborhood?: string,
  sort: 'new' | 'top' = 'new',
  page = 1,
  limit = 20
): Promise<CommunityPostListResult> {
  const params: Record<string, string | number> = { city, sort, page, limit };
  if (neighborhood) params.neighborhood = neighborhood;
  const { data } = await api.get('/community/:city/:neighborhood?', { params });
  return data.data;
}

export async function getPost(id: string): Promise<CommunityPost> {
  const { data } = await api.get(`/community/posts/${id}`);
  return data.data.post;
}

export async function deletePost(id: string): Promise<void> {
  await api.delete(`/community/posts/${id}`);
}

export async function votePost(
  id: string,
  vote: 'up' | 'down' | 'remove'
): Promise<VoteResult> {
  const { data } = await api.put(`/community/posts/${id}/vote`, { vote });
  return data.data;
}

export async function reportPost(
  id: string,
  reason: string,
  description?: string
): Promise<void> {
  await api.post(`/reports`, {
    targetType: 'post',
    targetId: id,
    reason,
    description,
  });
}
