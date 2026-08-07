export type MapSkillType = 'teach' | 'learn';

export interface MapPin {
  id: string;
  userId: string;
  type: MapSkillType;
  categoryName: string;
  skillName: string;
  format: string;
  sessionLength: '30min' | '1hr' | '2hr+';
  coordinates: [number, number];
  distanceKm?: number;
  teacher: {
    _id: string;
    displayName: string;
    avatar: string;
    rating: number;
    reviewCount: number;
  };
}

export interface MapDiscoveryParams {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  categoryIds?: string[];
  type?: MapSkillType;
  availability?: boolean;
  limit?: number;
}

export interface GeocodedPlace {
  lat: number;
  lng: number;
  displayName: string;
  label: string;
  localName?: string;
}

export interface NeighborhoodPage {
  city: string;
  neighborhood: string;
  skillCount: number;
  teacherCount: number;
  topCategories: Array<{ name: string; count: number }>;
  recentSkills: Array<Record<string, unknown>>;
}

export interface NeighborhoodListItem {
  city: string;
  neighborhood: string;
  skillCount: number;
}

export interface LearnerRequest {
  _id: string;
  authorId: { _id: string; displayName: string; avatar: string };
  skillName: string;
  categoryName: string;
  description: string;
  city: string;
  neighborhood?: string;
  format: 'in-person' | 'online' | 'either';
  availability: string[];
  status: 'open' | 'filled' | 'expired' | 'deleted';
  responsesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LearnerRequestListResult {
  requests: LearnerRequest[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SmartMatch {
  userId: string;
  displayName: string;
  avatar: string;
  skillName: string;
  skillId: string;
  categoryName: string;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  format: string;
  matchScore: number;
}

export interface SessionNote {
  _id?: string;
  connectionId?: string;
  userId?: string;
  content: string;
}

export interface SavedSearchItem {
  _id: string;
  userId: string;
  name: string;
  filters: {
    category?: string;
    format?: string;
    type?: 'teach' | 'learn';
    radius?: number;
    availability?: string[];
    proficiencyLevel?: string;
  };
  alertEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
