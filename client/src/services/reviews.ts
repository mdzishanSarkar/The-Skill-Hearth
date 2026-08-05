import api from './api';
import type { Review } from '../types/review.types';
import type { Connection } from '../types/connection.types';

export async function getSkillReviews(skillId: string): Promise<Review[]> {
  const { data } = await api.get(`/skills/${skillId}/reviews`);
  return (data.data as { reviews: Review[] }).reviews;
}

export async function submitReview(
  connectionId: string,
  input: {
    rating: number;
    content: string;
    tags: string[];
    wouldRecommend?: boolean;
  },
): Promise<Review> {
  const { data } = await api.post('/reviews', { connectionId, ...input });
  return (data.data as { review: Review }).review;
}

export async function updateReview(
  reviewId: string,
  input: {
    rating: number;
    content: string;
    tags: string[];
    wouldRecommend?: boolean;
  },
): Promise<Review> {
  const { data } = await api.patch(`/reviews/${reviewId}`, input);
  return (data.data as { review: Review }).review;
}

export async function getMyConnectionReview(
  connectionId: string,
): Promise<Review | null> {
  const { data } = await api.get(`/reviews/connection/${connectionId}`);
  return (data.data as { review: Review | null }).review;
}

export async function getReviewableConnections(): Promise<Connection[]> {
  const { data } = await api.get('/reviews/mine/connections');
  return (data.data as { connections: Connection[] }).connections;
}

export async function getUserReviews(
  userId: string,
  page = 1,
  limit = 5,
): Promise<{ reviews: Review[]; total: number; page: number; totalPages: number }> {
  const { data } = await api.get(`/reviews/user/${userId}`, { params: { page, limit } });
  return data.data as { reviews: Review[]; total: number; page: number; totalPages: number };
}
