import api from './api';
import type { AppNotification, NotificationListResult } from '../types/notification.types';

export async function getNotifications(page = 1, limit = 20): Promise<NotificationListResult> {
  const { data } = await api.get('/notifications', { params: { page, limit } });
  return data.data;
}

export async function markAsRead(notificationId: string): Promise<AppNotification> {
  const { data } = await api.patch(`/notifications/${notificationId}/read`);
  return data.data;
}

export async function markAllAsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { data } = await api.get('/notifications/unread');
  return data.data.count;
}

export async function getUnreadRadarCount(): Promise<number> {
  const { data } = await api.get('/notifications/unread-radar');
  return data.data.count;
}
