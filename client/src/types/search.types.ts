import type { SkillWithTeacher } from './skill.types';

export interface NaturalSearchLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface NaturalSearchResult {
  query: string;
  skillQuery: string;
  location: NaturalSearchLocation | null;
  matchedLocation: boolean;
  nearMe: boolean;
  skills: SkillWithTeacher[];
  total: number;
}
