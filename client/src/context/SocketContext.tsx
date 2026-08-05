import { createContext, useContext } from 'react';
import type { Socket } from 'socket.io-client';

export interface SocketContextValue {
  socket: Socket | null;
}

export const SocketContext = createContext<SocketContextValue>({ socket: null });

export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}
