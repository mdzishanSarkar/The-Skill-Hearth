import { useCallback, useEffect, useState } from 'react';
import { getFriendsOnline } from '../services/friends.service';
import { useSocket } from './useSocket';

interface PresencePayload {
  userId: string;
}

export function useFriendPresence() {
  const { socket } = useSocket();
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    getFriendsOnline()
      .then((online) => {
        if (!cancelled) setOnlineIds(new Set(online.map((f) => f._id)));
      })
      .catch(() => {
        // Presence is best-effort; fall back to realtime events only.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleOnline = (payload: PresencePayload) => {
      if (!payload?.userId) return;
      setOnlineIds((prev) => {
        if (prev.has(payload.userId)) return prev;
        const next = new Set(prev);
        next.add(payload.userId);
        return next;
      });
    };
    const handleOffline = (payload: PresencePayload) => {
      if (!payload?.userId) return;
      setOnlineIds((prev) => {
        if (!prev.has(payload.userId)) return prev;
        const next = new Set(prev);
        next.delete(payload.userId);
        return next;
      });
    };
    socket.on('friend:online', handleOnline);
    socket.on('friend:offline', handleOffline);
    return () => {
      socket.off('friend:online', handleOnline);
      socket.off('friend:offline', handleOffline);
    };
  }, [socket]);

  const isOnline = useCallback((userId: string) => onlineIds.has(userId), [onlineIds]);

  return { onlineIds, isOnline };
}
