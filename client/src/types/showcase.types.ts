export interface ShowcaseAuthor {
  _id: string;
  displayName: string;
  avatar: string;
  stats?: {
    totalSessions?: number;
    averageRating?: number;
  };
}

export interface ShowcaseMedia {
  url: string;
  publicId: string;
  caption?: string;
}

export interface Showcase {
  _id: string;
  userId: ShowcaseAuthor | null;
  skillId?: {
    _id: string;
    skillName: string;
    categoryName: string;
  };
  title: string;
  description: string;
  media: ShowcaseMedia[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShowcaseListResult {
  showcases: Showcase[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateShowcaseInput {
  skillId?: string;
  title: string;
  description: string;
  media?: Array<{ url: string; publicId: string; caption?: string }>;
}

export interface LikeResult {
  likeCount: number;
  liked: boolean;
}
