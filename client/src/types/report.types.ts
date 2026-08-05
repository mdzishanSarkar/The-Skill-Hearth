export type ReportTargetType = 'user' | 'skill' | 'message' | 'review' | 'post';

export type ReportReason =
  | 'harassment'
  | 'inappropriate'
  | 'spam'
  | 'fake'
  | 'no-show'
  | 'misleading'
  | 'other';

export type ReportStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export interface Report {
  _id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  action?: string;
  resolution?: string;
  reporter?: {
    _id: string;
    displayName: string;
    avatar: string;
    email: string;
  } | null;
  assignedTo?: string;
  target?: Record<string, unknown> | null;
  contextMessages?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReportListResult {
  reports: Report[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReportListParams {
  page?: number;
  limit?: number;
  status?: string;
  targetType?: string;
}

export interface SubmitReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
}

export const REPORT_REASONS: Record<ReportTargetType, { value: ReportReason; label: string }[]> = {
  user: [
    { value: 'harassment', label: 'Harassment' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'spam', label: 'Spam' },
    { value: 'fake', label: 'Fake profile' },
    { value: 'no-show', label: 'No-show' },
    { value: 'other', label: 'Other' },
  ],
  skill: [
    { value: 'misleading', label: 'Misleading' },
    { value: 'inappropriate', label: 'Inappropriate' },
    { value: 'spam', label: 'Spam' },
    { value: 'other', label: 'Other' },
  ],
  message: [
    { value: 'harassment', label: 'Harassment' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'spam', label: 'Spam' },
    { value: 'other', label: 'Other' },
  ],
  review: [
    { value: 'fake', label: 'Fake review' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'inappropriate', label: 'Inappropriate' },
    { value: 'spam', label: 'Spam' },
    { value: 'other', label: 'Other' },
  ],
  post: [
    { value: 'harassment', label: 'Harassment' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'spam', label: 'Spam' },
    { value: 'other', label: 'Other' },
  ],
};
