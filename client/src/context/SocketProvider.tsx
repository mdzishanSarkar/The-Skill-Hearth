import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SocketContext } from './SocketContext';
import { useAuth } from '../hooks/useAuth';
import { getAccessToken } from '../services/tokenStore';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    const apiBase = (import.meta.env.VITE_API_URL as string) || (import.meta.env.DEV ? 'http://localhost:5000' : '');
    const s = io(apiBase.replace(/\/api$/, ''), {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    const HEARTBEAT_INTERVAL_MS = 20000;
    const sendHeartbeat = () => {
      if (s.connected) s.emit('ping');
    };

    s.on('connect', () => {
      console.log('Socket connected');
      sendHeartbeat();
    });
    const heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    s.on('connect_error', () => {
      console.warn('Socket connection error');
    });

    socketRef.current = s;
    setSocket(s);

    return () => {
      clearInterval(heartbeatInterval);
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}
