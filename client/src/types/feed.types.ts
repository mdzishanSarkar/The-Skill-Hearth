export type ActivityEventType =
  | 'skill_added'
  | 'skill_completed'
  | 'session_completed'
  | 'session_taught'
  | 'session_learned'
  | 'badge_earned'
  | 'streak_milestone'
  | 'skill_swap_accepted'
  | 'joined_group_session'
  | 'review_received'
  | 'friend_joined'
  | 'friend_request_accepted'
  | 'level_up'
  | 'journal_highlight'
  | 'challenge_completed';

export type ActivityVisibility = 'public' | 'friends' | 'close_friends' | 'private';

export interface FeedActor {
  _id: string;
  displayName: string;
  avatar: string;
  level: number;
}

export interface FeedEvent {
  _id: string;
  eventType: ActivityEventType;
  subjectType: string;
  subjectId?: string;
  actor: FeedActor;
  preview: {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    emoji?: string;
  };
  visibility: ActivityVisibility;
  reactions: Array<{ userId: string; emoji: string; createdAt: string }>;
  reactionCounts: Record<string, number>;
  myReaction: string | null;
  createdAt: string;
}

export interface FeedListResult {
  events: FeedEvent[];
  total: number;
  page: number;
  totalPages: number;
}

export const FEED_REACTION_EMOJIS = ['🎉', '❤️', '👏', '🔥', '💡'] as const;
