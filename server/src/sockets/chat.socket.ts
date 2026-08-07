import type { Server, Socket } from 'socket.io';
import { Connection, Message } from '../models';
import * as messageService from '../services/message';
import type { SocketUser } from '../types/socket.types';

export function setupChatSockets(io: Server, socket: Socket, user: SocketUser) {
  socket.on('chat:join', async (connectionId: string) => {
    if (!connectionId) return;

    const connection = await Connection.findById(connectionId);
    if (!connection) return;

    const isParticipant =
      String(connection.requesterId) === user.userId ||
      String(connection.teacherId) === user.userId;
    if (!isParticipant) return;

    const roomName = `chat_${connectionId}`;
    socket.join(roomName);
  });

  socket.on('chat:leave', (connectionId: string) => {
    socket.leave(`chat_${connectionId}`);
  });

  socket.on('message:send', async (data: { connectionId: string; content: string }) => {
    if (!data.connectionId || !data.content) return;

    try {
      const message = await messageService.sendMessage(
        data.connectionId,
        user.userId,
        data.content,
      );

      const populated = await Message.findById(message._id)
        .populate('senderId', 'displayName avatar')
        .lean();

      const eventPayload = {
        _id: String(populated?._id ?? message._id),
        connectionId: data.connectionId,
        senderId: user.userId,
        senderName: user.displayName,
        content: data.content,
        type: 'text' as const,
        createdAt: (populated?.createdAt ?? new Date()).toISOString(),
      };

      io.to(`chat_${data.connectionId}`).emit('message:new', eventPayload);
    } catch {
      socket.emit('message:error', { message: 'Failed to send message' });
    }
  });

  socket.on('message:delivered', async (data: { connectionId: string; messageId: string }) => {
    if (!data.connectionId || !data.messageId) return;
    try {
      await messageService.markAsDelivered(data.messageId);
      io.to(`chat_${data.connectionId}`).emit('message:delivered', {
        messageId: data.messageId,
        deliveredAt: new Date().toISOString(),
      });
    } catch {
      // silent fail
    }
  });

  socket.on('message:read', async (data: { connectionId: string }) => {
    if (!data.connectionId) return;
    try {
      await messageService.markAsRead(data.connectionId, user.userId);
      socket.to(`chat_${data.connectionId}`).emit('message:read', {
        connectionId: data.connectionId,
        userId: user.userId,
        readAt: new Date().toISOString(),
      });
    } catch {
      // silent fail
    }
  });

  socket.on('typing:start', (data: { connectionId: string }) => {
    if (!data.connectionId) return;
    socket.to(`chat_${data.connectionId}`).emit('typing:start', {
      connectionId: data.connectionId,
      userId: user.userId,
      displayName: user.displayName,
    });
  });

  socket.on('typing:stop', (data: { connectionId: string }) => {
    if (!data.connectionId) return;
    socket.to(`chat_${data.connectionId}`).emit('typing:stop', {
      connectionId: data.connectionId,
      userId: user.userId,
    });
  });
}
