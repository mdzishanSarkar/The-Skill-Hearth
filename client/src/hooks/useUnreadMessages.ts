import { useCallback, useEffect, useState } from 'react';
import { getUnreadMessageCount } from '../services/messages';
import { useSocket } from './useSocket';

export function useUnreadMessages() {
  const { socket } = useSocket();
  const [count, setCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getUnreadMessageCount()
      .then((value) => {
        if (!cancelled) setCount(value);
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!socket) return;
    const handle = () => refresh();
    socket.on('message:new', handle);
    socket.on('message:read', handle);
    return () => {
      socket.off('message:new', handle);
      socket.off('message:read', handle);
    };
  }, [socket, refresh]);

  return { unreadCount: count, refresh };
}
