export type NotificationType =
  | 'request_received'
  | 'request_accepted'
  | 'request_rejected'
  | 'new_message'
  | 'review_prompt'
  | 'system_warning'
  | 'account_suspended'
  | 'account_banned'
  | 'skill_removed'
  | 'review_received';

export interface AppNotification {
  _id: string;
  userId: string;
  type: NotificationType;
  referenceId?: string;
  referenceModel?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResult {
  notifications: AppNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  request_received: '📥',
  request_accepted: '✅',
  request_rejected: '❌',
  new_message: '💬',
  review_prompt: '⭐',
  system_warning: '⚠️',
  account_suspended: '⛔',
  account_banned: '🚫',
  skill_removed: '🗑️',
  review_received: '🌟',
};
