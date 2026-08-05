import { useCallback, useEffect, useState } from 'react';
import { getUnreadNotificationCount } from '../services/notifications';
import { useSocket } from './useSocket';

export function useNotifications() {
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
    const handleNotification = () => refresh();
    socket.on('notification:new', handleNotification);
    return () => {
      socket.off('notification:new', handleNotification);
    };
  }, [socket, refresh]);

  return { unreadCount, refresh };
}
