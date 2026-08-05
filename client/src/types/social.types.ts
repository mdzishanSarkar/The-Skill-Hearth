export interface OAuthProviderInfo {
  provider: 'google' | 'apple';
  email: string;
  displayName: string;
  linkedAt: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  lastUsedAt: string | null;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeDataUrl: string;
  otpauthUrl: string;
}

export interface ProfileCompleteness {
  score: number;
  missing: string[];
  suggestions: string[];
}

export interface SkillSuggestion {
  _id: string;
  userId: { _id: string; displayName: string; avatar: string };
  skillName: string;
  categoryName: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes: string;
  votes: number;
  reviewedBy?: { _id: string; displayName: string };
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillSuggestionListResult {
  suggestions: SkillSuggestion[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SkillBundle {
  _id: string;
  name: string;
  description: string;
  skillIds: Array<{ _id: string; skillName: string; categoryName: string; description?: string }>;
  isOfficial: boolean;
  createdBy: { _id: string; displayName: string };
  votes: number;
  coverImage: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillBundleListResult {
  bundles: SkillBundle[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SwapSuggestion {
  otherUser: { _id: string; displayName: string; avatar: string };
  userTeachesSkill: { skillId: string; skillName: string };
  otherTeachesSkill: { skillId: string; skillName: string };
  matchScore: number;
}

export interface Swap {
  _id: string;
  userAId: { _id: string; displayName: string; avatar: string };
  userBId: { _id: string; displayName: string; avatar: string };
  userATeachesSkillId: { _id: string; skillName: string; categoryName: string };
  userBTeachesSkillId: { _id: string; skillName: string; categoryName: string };
  status: 'suggested' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export interface Endorsement {
  _id: string;
  endorserId: { _id: string; displayName: string; avatar: string };
  endorseeId: string;
  skillId: { _id: string; skillName: string; categoryName: string };
  connectionId: string;
  createdAt: string;
}

export interface BlockOutDate {
  _id: string;
  userId: string;
  date: string;
  reason: string;
  createdAt: string;
}
