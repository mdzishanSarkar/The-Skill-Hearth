import api from './api';
import type { Review } from '../types/review.types';

export async function getSkillReviews(skillId: string): Promise<Review[]> {
  const { data } = await api.get(`/skills/${skillId}/reviews`);
  return (data.data as { reviews: Review[] }).reviews;
}
