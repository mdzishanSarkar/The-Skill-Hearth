export interface LevelInfo {
  level: number;
  name: string;
  xpRequired: number;
  icon: string;
}

export interface BadgeInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earned: boolean;
}

export interface StreakInfo {
  type: 'teaching' | 'learning' | 'logging';
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string;
  streakStartDate?: string;
  freezesAvailable: number;
  frozenUntil?: string;
  milestones: number[];
}

export interface StreakStatus extends StreakInfo {
  atRisk: boolean;
}

export interface GamificationProfile {
  xp: number;
  level: LevelInfo;
  nextLevel: LevelInfo | null;
  progressToNextLevel: number;
  badges: BadgeInfo[];
  earnedBadgeIds: string[];
  streakFreezeAvailable: number;
  referralCode: string;
  stats: {
    sessionsCompleted: number;
    averageRating: number;
    reviewCount: number;
  };
  friendCount: number;
  streaks: StreakInfo[];
}

export type GamificationProfileResult = Omit<GamificationProfile, 'streaks'> & {
  streaks: StreakStatus[];
};

export interface PublicGamification {
  level: LevelInfo;
  xp: number;
  badges: Array<Omit<BadgeInfo, 'earned'>>;
  friendCount: number;
}

export interface LeaderboardEntry {
  _id: string;
  displayName: string;
  avatar: string;
  city: string;
  xp: number;
  level: number;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  myRank: number | null;
  scope: 'global' | 'local';
}

export interface FriendsStreakEntry {
  userId: string;
  displayName: string;
  avatar: string;
  type: 'teaching' | 'learning' | 'logging';
  currentStreak: number;
  longestStreak: number;
}
