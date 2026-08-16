export interface UserLocation {
  city: string;
  zipCode: string;
  neighborhood: string;
  type: 'Point';
  coordinates: [number, number];
  radiusPreference: number;
}

export interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface UserStats {
  sessionsCompleted: number;
  averageRating: number;
  reviewCount: number;
}

export interface UserGamification {
  xp: number;
  level: number;
  badges: string[];
  streakFreezeAvailable: number;
  referralCode: string;
}

export type MapMode = 'auto' | 'day' | 'night';

export interface UserMapPreferences {
  defaultMode: MapMode;
  defaultView: 'map' | 'list';
  clusterMarkers: boolean;
}

export interface UserQuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface User {
  _id: string;
  email: string;
  username?: string;
  displayName: string;
  bio: string;
  avatar: string;
  avatarPublicId?: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'banned';
  location: UserLocation;
  showOnMap: boolean;
  availability: AvailabilitySlot[];
  stats: UserStats;
  isEmailVerified: boolean;
  hasCompletedOnboarding: boolean;
  isIdVerified: boolean;
  isShadowBanned?: boolean;
  gamification?: UserGamification;
  friendIds?: string[];
  closeFriendIds?: string[];
  feedVisibility?: 'public' | 'friends' | 'close_friends' | 'private';
  mapPreferences?: UserMapPreferences;
  quietHours?: UserQuietHours;
  weeklyDigest?: boolean;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  username?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  location?: Partial<
    Pick<UserLocation, 'city' | 'zipCode' | 'neighborhood' | 'coordinates' | 'radiusPreference'>
  >;
  showOnMap?: boolean;
  availability?: AvailabilitySlot[];
  mapPreferences?: Partial<
    Pick<UserMapPreferences, 'defaultMode' | 'defaultView' | 'clusterMarkers'>
  >;
  quietHours?: Partial<Pick<UserQuietHours, 'enabled' | 'startTime' | 'endTime' | 'timezone'>>;
  weeklyDigest?: boolean;
}

export interface RegisterInput {
  email: string;
  password: string;
  username: string;
  displayName: string;
  bio?: string;
  adminCode?: string;
}

export interface OnboardingSkillSelection {
  categoryId: string;
  skillName: string;
  description?: string;
}

export interface OnboardingInput {
  teachSkills: OnboardingSkillSelection[];
  learnSkills: OnboardingSkillSelection[];
  location: {
    city: string;
    zipCode: string;
    neighborhood?: string;
    coordinates: [number, number];
    radiusPreference: number;
  };
  bio?: string;
  availability?: AvailabilitySlot[];
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
}
