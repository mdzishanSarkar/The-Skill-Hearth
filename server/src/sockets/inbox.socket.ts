import type { Server, Socket } from 'socket.io';
import { Message, Connection } from '../models';
import * as messageService from '../services/message.service';
import type { SocketUser } from '../types/socket.types';

const MESSAGE_LIMIT_SECONDS = 60;
const TYPING_TTL_SECONDS = 3;
const rateLimitMap = new Map<string, number[]>();

function getNow() { return Date.now(); }

function checkRateLimit(userId: string, event: string, limitMs: number, limitCount: number) {
  const key = `${event}:${userId}`;
  const timestamps = rateLimitMap.get(key) ?? [];
  const windowStart = getNow() - limitMs;
  const fresh = timestamps.filter((ts) => ts > windowStart);
  if (fresh.length >= limitCount) {
    return false;
  }
  fresh.push(getNow());
  rateLimitMap.set(key, fresh);
  return true;
}

export function setupInboxSockets(io: Server, socket: Socket, user: SocketUser) {
  socket.on('join_room', async ({ connectionId }: { connectionId?: string }) => {
    if (!connectionId) return;
    if (!/^[a-fA-F0-9]{24}$/.test(String(connectionId))) return;

    const connection = await Connection.findById(connectionId).lean();
    if (!connection) {
      socket.emit('message_error', { code: 'CONNECTION_NOT_FOUND', message: 'Chat room not found.' });
      return;
    }

    const isParticipant = String(connection.requesterId) === user.userId || String(connection.teacherId) === user.userId;
    if (!isParticipant) {
      socket.emit('message_error', { code: 'NOT_PARTICIPANT', message: 'You are not part of this conversation.' });
      return;
    }

    const roomName = `chat_${connectionId}`;
    socket.join(roomName);

    const messages = await Message.find({ connectionId }).sort({ createdAt: -1 }).limit(50).lean();
    socket.emit('room_joined', {
      chatRoomId: roomName,
      messages: messages.reverse(),
      participants: [String(connection.requesterId), String(connection.teacherId)],
    });

    socket.to(roomName).emit('user_presence', { userId: user.userId, status: 'online' });
  });

  socket.on('leave_room', ({ connectionId }: { connectionId?: string }) => {
    if (!connectionId) return;
    socket.leave(`chat_${connectionId}`);
    socket.to(`chat_${connectionId}`).emit('user_presence', { userId: user.userId, status: 'offline' });
  });

  socket.on('send_message', async ({ connectionId, content }: { connectionId?: string; content?: string }) => {
    if (!connectionId || !content) {
      socket.emit('message_error', { code: 'VALIDATION_ERROR', message: 'connectionId and content are required.' });
      return;
    }

    if (!checkRateLimit(user.userId, 'send_message', MESSAGE_LIMIT_SECONDS * 1000, 30)) {
      socket.emit('rate_limited', { event: 'send_message', retryAfter: 60 });
      return;
    }

    try {
      const result = await messageService.sendMessage({
        senderId: user.userId,
        connectionId,
        content,
      });

      const roomName = `chat_${connectionId}`;
      io.to(roomName).emit('new_message', { message: result });
    } catch (error: any) {
      const code = error?.code || 'MESSAGE_ERROR';
      const message = error?.message || 'Message could not be sent.';
      socket.emit('message_error', { code, message });
    }
  });

  socket.on('typing_start', ({ connectionId }: { connectionId?: string }) => {
    if (!connectionId) return;
    if (!checkRateLimit(user.userId, 'typing_start', 10000, 5)) {
      socket.emit('rate_limited', { event: 'typing_start', retryAfter: 10 });
      return;
    }

    socket.to(`chat_${connectionId}`).except(socket.id).emit('typing', {
      userId: user.userId,
      isTyping: true,
      connectionId,
    });
  });

  socket.on('typing_stop', ({ connectionId }: { connectionId?: string }) => {
    if (!connectionId) return;
    socket.to(`chat_${connectionId}`).except(socket.id).emit('typing', {
      userId: user.userId,
      isTyping: false,
      connectionId,
    });
  });

  socket.on('mark_read', async ({ connectionId, lastReadMessageId }: { connectionId?: string; lastReadMessageId?: string }) => {
    if (!connectionId) return;
    try {
      const result = await messageService.markAsRead({ connectionId, userId: user.userId, lastReadMessageId });
      socket.to(`chat_${connectionId}`).except(socket.id).emit('messages_read', {
        userId: user.userId,
        readAt: new Date().toISOString(),
        connectionId,
        updatedCount: result.updatedCount,
      });
    } catch (error: any) {
      socket.emit('message_error', { code: error?.code || 'READ_ERROR', message: error?.message || 'Unable to mark messages as read.' });
    }
  });

  socket.on('delete_message', async ({ messageId }: { messageId?: string }) => {
    if (!messageId) return;
    try {
      const result = await messageService.deleteMessage({ messageId, requestingUserId: user.userId });
      const message = await Message.findById(messageId).lean();
      if (message?.connectionId) {
        io.to(`chat_${String(message.connectionId)}`).emit('message_deleted', {
          messageId,
          deletedAt: new Date().toISOString(),
          result,
        });
      }
    } catch (error: any) {
      socket.emit('message_error', { code: error?.code || 'DELETE_ERROR', message: error?.message || 'Unable to delete message.' });
    }
  });

  socket.on('react_to_message', async ({ messageId, emoji }: { messageId?: string; emoji?: string }) => {
    if (!messageId || !emoji) return;
    if (!checkRateLimit(user.userId, 'react', 60000, 20)) {
      socket.emit('rate_limited', { event: 'react', retryAfter: 60 });
      return;
    }

    try {
      const result = await messageService.addReaction({ messageId, userId: user.userId, emoji });
      const message = await Message.findById(messageId).lean();
      if (message?.connectionId) {
        io.to(`chat_${String(message.connectionId)}`).emit('reaction_updated', {
          messageId,
          reactions: result.reactions,
        });
      }
    } catch (error: any) {
      socket.emit('message_error', { code: error?.code || 'REACTION_ERROR', message: error?.message || 'Unable to update reaction.' });
    }
  });

  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });
}
