export interface SubscriptionStatus {
  isPro: boolean;
  plan: 'monthly' | 'annual' | null;
  expiresAt: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface PortalSession {
  url: string;
}

export interface Tip {
  _id: string;
  payerId: string;
  payeeId: string;
  connectionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  platformFee: number;
  createdAt: string;
}

export interface CreateTipResult {
  tip: Tip;
  clientSecret: string;
}

export interface ImpactReport {
  user: {
    displayName: string;
    memberSince: string;
  };
  stats: {
    sessionsCompleted: number;
    totalConnections: number;
    skillsShared: number;
    skillsLearned: number;
    neighborhoodsReached: number;
  };
  skills: {
    teaching: string[];
    learning: string[];
  };
}

export interface ProBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}
