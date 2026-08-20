export interface ChallengeParticipant {
  userId: {
    _id: string;
    displayName: string;
    avatar: string;
  };
  joinedAt: string;
  progress: number;
  completedAt?: string;
}

export interface Challenge {
  _id: string;
  creatorId: {
    _id: string;
    displayName: string;
    avatar: string;
  } | null;
  title: string;
  description: string;
  skillCategory: string;
  challengeType: 'teach' | 'learn' | 'both';
  goalDescription: string;
  goalTarget: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  participants: ChallengeParticipant[];
  badgeName: string;
  badgeIcon: string;
  maxParticipants?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeListResult {
  challenges: Challenge[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateChallengeInput {
  title: string;
  description?: string;
  skillCategory: string;
  challengeType: 'teach' | 'learn' | 'both';
  goalDescription: string;
  goalTarget: number;
  startDate: string;
  endDate: string;
  badgeName: string;
  badgeIcon?: string;
  maxParticipants?: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: {
    _id: string;
    displayName: string;
    avatar: string;
  };
  progress: number;
  completedAt?: string;
  joinedAt: string;
}
