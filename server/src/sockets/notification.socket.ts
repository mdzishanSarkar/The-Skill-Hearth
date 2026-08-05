import type { Server, Socket } from 'socket.io';
import type { SocketUser } from '../types/socket.types';

export function setupNotificationSockets(_io: Server, _socket: Socket, _user: SocketUser) {
  // Notification events are emitted by services when creating notifications.
  // The client listens on `user_${userId}` room for notification:new events.
  // This handler is a placeholder for any socket-level notification logic.
}
