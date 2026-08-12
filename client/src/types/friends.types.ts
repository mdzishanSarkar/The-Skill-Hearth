export type FriendStatus =
  | { status: 'none' }
  | { status: 'pending_sent'; friendshipId: string }
  | { status: 'pending_received'; friendshipId: string }
  | { status: 'friends'; friendshipId: string; tier: 'friend' | 'close_friend' }
  | { status: 'blocked' };

export type FriendTier = 'friend' | 'close_friend';

export interface FriendSummary {
  _id: string;
  displayName: string;
  avatar: string;
  city: string;
  neighborhood: string;
  lastActive: string;
  level: number;
  isCloseFriend: boolean;
}

export interface FriendRequestUser {
  _id: string;
  displayName: string;
  avatar: string;
  city: string;
}

export interface FriendRequest {
  _id: string;
  requester: FriendRequestUser;
  addressee: FriendRequestUser;
  createdAt: string;
}

export interface FriendSuggestion {
  user: {
    _id: string;
    displayName: string;
    avatar: string;
    city: string;
    neighborhood: string;
    level: number;
  };
  score: number;
  reasons: string[];
}

export interface OnlineFriend {
  _id: string;
  displayName: string;
  avatar: string;
}

export interface MutualFriend {
  _id: string;
  displayName: string;
  avatar: string;
}
