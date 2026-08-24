import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getUnreadNotificationCount } from '../services/notifications';
import { useSocket } from './useSocket';
import type { AppNotification } from '../types/notification.types';
import { NOTIFICATION_ICONS } from '../types/notification.types';
import { playNotificationSound } from '../utils/notificationSound';

interface UseNotificationsOptions {
  onNotification?: (notification: AppNotification) => void;
}

/**
 * Dedupe socket deliveries across every hook instance mounted at once
 * (Navbar bell, NotificationsPage, ...) so each notification is handled once.
 */
const seenIds = new Set<string>();
const SEEN_LIMIT = 300;

function shouldHandle(id: string): boolean {
  if (seenIds.has(id)) return false;
  if (seenIds.size >= SEEN_LIMIT) {
    const oldest = seenIds.values().next().value;
    if (oldest !== undefined) seenIds.delete(oldest);
  }
  seenIds.add(id);
  return true;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getUnreadNotificationCount()
      .then((value) => {
        if (!cancelled) setUnreadCount(value);
      })
      .catch(() => {
        if (!cancelled) setUnreadCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (notification: AppNotification) => {
      // Message tones are handled by the inbox/messenger listeners; everything
      // else gets the iPhone-style tri-tone plus a visible popup.
      const isMessage = notification.type === 'new_message';
      // Dedupe only the noisy side effects; data callbacks must always run
      // because several hook instances are mounted at once.
      if (!isMessage && shouldHandle(notification._id)) {
        playNotificationSound();
        toast(notification.message, {
          icon: NOTIFICATION_ICONS[notification.type] ?? '🔔',
          duration: 4500,
        });
      }

      refresh();
      options.onNotification?.(notification);
    };
    socket.on('notification:new', handleNotification);
    return () => {
      socket.off('notification:new', handleNotification);
    };
  }, [socket, refresh, options]);

  return { unreadCount, refresh };
}
