import type { Server } from 'http';
import { Server as SocketServer, type Socket } from 'socket.io';
import { socketAuth } from '../middleware/socketAuth';
import { setupChatSockets } from '../sockets/chat.socket';
import { setupNotificationSockets } from '../sockets/notification.socket';
import type { SocketUser } from '../types/socket.types';

let io: SocketServer;

export function initializeSocket(httpServer: Server): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  io.use(async (socket, next) => {
    const user = await socketAuth(socket);
    if (!user) {
      return next(new Error('Authentication failed'));
    }
    (socket as Socket & { data: { user: SocketUser } }).data.user = user;
    next();
  });

  io.on('connection', (socket) => {
    const user = (socket as Socket & { data: { user: SocketUser } }).data.user;
    console.log(`Socket connected: ${user.userId}`);

    socket.join(`user_${user.userId}`);

    setupChatSockets(io, socket, user);
    setupNotificationSockets(io, socket, user);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${user.userId}`);
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}
