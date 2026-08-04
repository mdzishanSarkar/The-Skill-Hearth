import type { UserStats } from './user.types';

export type ReviewTag =
  | 'Patient teacher'
  | 'Well-prepared'
  | 'Great listener'
  | 'Practical tips'
  | 'Enthusiastic'
  | 'Clear explanations'
  | 'Flexible'
  | 'Knowledgeable'
  | 'Punctual'
  | 'Engaging';

export interface Review {
  _id: string;
  connectionId: string;
  reviewerId: string;
  revieweeId: string;
  skillId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  content: string;
  tags: ReviewTag[];
  wouldRecommend: boolean;
  createdAt: string;
  updatedAt: string;
  reviewer?: {
    _id: string;
    displayName: string;
    avatar: string;
    stats: UserStats;
  } | null;
}
