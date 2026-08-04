export interface UserLocation {
  city: string;
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

export interface User {
  _id: string;
  email: string;
  displayName: string;
  bio: string;
  avatar: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'banned';
  location: UserLocation;
  showOnMap: boolean;
  availability: AvailabilitySlot[];
  stats: UserStats;
  isEmailVerified: boolean;
  isIdVerified: boolean;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  avatar?: string;
  location?: Partial<
    Pick<UserLocation, 'city' | 'neighborhood' | 'coordinates' | 'radiusPreference'>
  >;
  showOnMap?: boolean;
  availability?: AvailabilitySlot[];
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  bio?: string;
  adminCode?: string;
}
