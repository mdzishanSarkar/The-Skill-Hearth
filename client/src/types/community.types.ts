export interface CommunityPostAuthor {
  _id: string;
  displayName: string;
  avatar: string;
}

export interface CommunityPost {
  _id: string;
  authorId: CommunityPostAuthor;
  content: string;
  city: string;
  neighborhood?: string;
  voteScore: number;
  userVote: 'up' | 'down' | null;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPostListResult {
  posts: CommunityPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCommunityPostInput {
  content: string;
  city: string;
  neighborhood?: string;
}

export interface VoteResult {
  voteScore: number;
  userVote: 'up' | 'down' | null;
}
