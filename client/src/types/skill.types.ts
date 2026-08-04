import type { AvailabilitySlot, UserLocation, UserStats } from './user.types';

export type SkillType = 'teach' | 'learn';
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';
export type SessionFormat = 'in-person' | 'online' | 'either';
export type SessionLength = '30min' | '1hr' | '2hr+';
export type SkillSort = 'newest' | 'most-reviewed' | 'closest';

export interface SkillStats {
  averageRating: number;
  reviewCount: number;
  completedSessionCount: number;
}

export interface Skill {
  _id: string;
  userId: string;
  type: SkillType;
  categoryId: string;
  categoryName: string;
  skillName: string;
  description: string;
  proficiencyLevel: ProficiencyLevel;
  format: SessionFormat;
  sessionLength: SessionLength;
  isActive: boolean;
  isDeleted: boolean;
  location: Pick<UserLocation, 'city' | 'neighborhood' | 'coordinates' | 'radiusPreference'> & {
    type?: 'Point';
  };
  stats: SkillStats;
  distanceKm?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillTeacher {
  _id: string;
  displayName: string;
  avatar: string;
  bio: string;
  location: UserLocation;
  availability: AvailabilitySlot[];
  stats: UserStats;
  status: string;
  lastActive: string;
  createdAt: string;
}

export interface SkillWithTeacher extends Skill {
  teacher?: SkillTeacher;
}

export interface CategorySkill {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  skills: CategorySkill[];
}

export interface SkillInput {
  type: SkillType;
  categoryId: string;
  skillName: string;
  description?: string;
  proficiencyLevel: ProficiencyLevel;
  format: SessionFormat;
  sessionLength: SessionLength;
}

export interface SkillListParams {
  page?: number;
  limit?: number;
  type?: SkillType;
  categoryId?: string;
  format?: SessionFormat;
  availability?: boolean;
  q?: string;
  sort?: SkillSort;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  userId?: string;
}

export interface SkillListResult {
  skills: SkillWithTeacher[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const PROFICIENCY_LABELS: Record<ProficiencyLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const FORMAT_LABELS: Record<SessionFormat, string> = {
  'in-person': 'In-person',
  online: 'Online',
  either: 'In-person or online',
};

export const LENGTH_LABELS: Record<SessionLength, string> = {
  '30min': '30 min',
  '1hr': '1 hr',
  '2hr+': '2 hr+',
};
