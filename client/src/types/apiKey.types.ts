export interface ApiKey {
  _id: string;
  ownerId: string;
  key: string;
  name: string;
  scopes: string[];
  status: 'active' | 'revoked';
  rateLimit: number;
  requestCount: number;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface CreateApiKeyInput {
  name: string;
  scopes?: string[];
  rateLimit?: number;
  expiresAt?: string;
}

export interface PlatformStats {
  totalUsers: number;
  totalSkills: number;
  totalConnections: number;
  totalReviews: number;
}
