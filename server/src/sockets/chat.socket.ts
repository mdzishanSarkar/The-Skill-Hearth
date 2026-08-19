import type { Server, Socket } from 'socket.io';
import { User } from '../models';
import * as messageService from '../services/message';
import * as conversationService from '../services/conversation.service';
import type { ConversationType } from '../services/conversation.service';
import type { SocketUser } from '../types/socket.types';
import { checkRateLimit } from '../utils/rateLimit';

const typingTimers = new Map<string, NodeJS.Timeout>();

const MESSAGE_LIMIT = 30;
const MESSAGE_WINDOW_SECONDS = 60;
const TYPING_LIMIT = 5;
const TYPING_WINDOW_SECONDS = 10;
const REACTION_LIMIT = 60;
const REACTION_WINDOW_SECONDS = 60;
const EDIT_LIMIT = 10;
const EDIT_WINDOW_SECONDS = 60;
const OPEN_LIMIT = 100;
const OPEN_WINDOW_SECONDS = 60;
const TYPING_AUTO_STOP_MS = 5000;

function isConversationType(value: unknown): value is ConversationType {
  return value === 'skill' || value === 'friend';
}

function socketEmit(socket: Socket, event: string, payload: unknown): void {
  socket.emit(event, payload);
}

export function setupChatSockets(io: Server, socket: Socket, user: SocketUser) {
  // ── LEGACY HANDLERS (kept for backward compatibility) ─────────────────────

  socket.on('chat:join', async (connectionId: string) => {
    if (!connectionId) return;
    try {
      const context = await conversationService.getConversationContext(user.userId, connectionId, 'skill');
      for (const roomId of context.roomIds) socket.join(roomId);
    } catch {
      // not a participant
    }
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
      io.to(`chat_${data.connectionId}`).emit('message:new', {
        _id: String(message._id ?? ''),
        connectionId: data.connectionId,
        senderId: user.userId,
        senderName: user.displayName,
        content: data.content,
        type: 'text' as const,
        createdAt: new Date().toISOString(),
      });
    } catch {
      socketEmit(socket, 'message:error', { message: 'Failed to send message' });
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

  // ── MESSENGER HANDLERS ────────────────────────────────────────────────────

  socket.on('messenger:open_conversation', async (data: { conversationId: string; conversationType: unknown }) => {
    if (!data?.conversationId || !isConversationType(data.conversationType)) return;

    const rate = await checkRateLimit(`messenger:open:${user.userId}`, OPEN_LIMIT, OPEN_WINDOW_SECONDS);
    if (!rate.allowed) {
      socketEmit(socket, 'messenger:error', { code: 'RATE_LIMITED', event: 'open_conversation', retryAfter: rate.retryAfterSeconds });
      return;
    }

    try {
      const context = await conversationService.getConversationContext(
        user.userId,
        data.conversationId,
        data.conversationType,
      );
      for (const roomId of context.roomIds) socket.join(roomId);

      const result = await conversationService.markConversationRead({
        userId: user.userId,
        conversationId: data.conversationId,
        conversationType: data.conversationType,
      });

      if (result.updatedCount > 0) {
        for (const roomId of context.roomIds) {
          socket.to(roomId).emit('messenger:messages_read', {
            conversationId: data.conversationId,
            lastReadMessageId: null,
            readBy: user.userId,
            readAt: new Date().toISOString(),
          });
        }
      }

      const total = await conversationService.getTotalUnread(user.userId);
      socketEmit(socket, 'messenger:unread_total_updated', { total });
    } catch {
      socketEmit(socket, 'messenger:error', { code: 'UNAUTHORIZED_CONVERSATION', message: 'Unable to open conversation' });
    }
  });

  socket.on(
    'messenger:send_message',
    async (data: {
      conversationId: string;
      conversationType: unknown;
      content?: string;
      type?: 'text' | 'gif';
      gifUrl?: string;
      gifWidth?: number;
      gifHeight?: number;
      replyToMessageId?: string;
    }) => {
      if (!data?.conversationId || !isConversationType(data.conversationType)) return;

      const rate = await checkRateLimit(`messenger:send:${user.userId}`, MESSAGE_LIMIT, MESSAGE_WINDOW_SECONDS);
      if (!rate.allowed) {
        socketEmit(socket, 'messenger:error', { code: 'RATE_LIMITED', event: 'send_message', retryAfter: rate.retryAfterSeconds });
        return;
      }

      try {
        const result = await conversationService.sendMessageAndNotify(io, {
          senderId: user.userId,
          conversationId: data.conversationId,
          conversationType: data.conversationType,
          content: data.content,
          type: data.type,
          gifUrl: data.gifUrl,
          gifWidth: data.gifWidth,
          gifHeight: data.gifHeight,
          replyToMessageId: data.replyToMessageId,
        });

        if (result.isShadowBanned) {
          const total = await conversationService.getTotalUnread(user.userId);
          socketEmit(socket, 'messenger:unread_total_updated', { total });
        }
      } catch (error) {
        const code = error instanceof Error && 'code' in error ? String((error as { code?: unknown }).code ?? 'MESSAGE_ERROR') : 'MESSAGE_ERROR';
        const message = error instanceof Error ? error.message : 'Message could not be sent.';
        socketEmit(socket, 'messenger:error', { code, message });
      }
    }
  );

  socket.on('messenger:typing_start', (data: { conversationId: string; conversationType: unknown }) => {
    if (!data?.conversationId || !isConversationType(data.conversationType)) return;

    void checkRateLimit(`messenger:typing:${user.userId}`, TYPING_LIMIT, TYPING_WINDOW_SECONDS).then((rate) => {
      if (!rate.allowed) {
        socketEmit(socket, 'messenger:error', { code: 'RATE_LIMITED', event: 'typing', retryAfter: rate.retryAfterSeconds });
        return;
      }
      socket.to(`chat_${data.conversationId}`).except(socket.id).emit('messenger:user_typing', {
        conversationId: data.conversationId,
        userId: user.userId,
        displayName: user.displayName,
      });
      if (data.conversationType === 'friend') {
        socket.to(`dm_${data.conversationId}`).except(socket.id).emit('messenger:user_typing', {
          conversationId: data.conversationId,
          userId: user.userId,
          displayName: user.displayName,
        });
      }

      const timerKey = `${user.userId}:${data.conversationId}`;
      const existing = typingTimers.get(timerKey);
      if (existing) clearTimeout(existing);
      typingTimers.set(
        timerKey,
        setTimeout(() => {
          socket.to(`chat_${data.conversationId}`).except(socket.id).emit('messenger:user_stopped_typing', {
            conversationId: data.conversationId,
            userId: user.userId,
          });
          if (data.conversationType === 'friend') {
            socket.to(`dm_${data.conversationId}`).except(socket.id).emit('messenger:user_stopped_typing', {
              conversationId: data.conversationId,
              userId: user.userId,
            });
          }
          typingTimers.delete(timerKey);
        }, TYPING_AUTO_STOP_MS),
      );
    });
  });

  socket.on('messenger:typing_stop', (data: { conversationId: string; conversationType: unknown }) => {
    if (!data?.conversationId || !isConversationType(data.conversationType)) return;

    const timerKey = `${user.userId}:${data.conversationId}`;
    const timer = typingTimers.get(timerKey);
    if (timer) {
      clearTimeout(timer);
      typingTimers.delete(timerKey);
    }

    socket.to(`chat_${data.conversationId}`).except(socket.id).emit('messenger:user_stopped_typing', {
      conversationId: data.conversationId,
      userId: user.userId,
    });
    if (data.conversationType === 'friend') {
      socket.to(`dm_${data.conversationId}`).except(socket.id).emit('messenger:user_stopped_typing', {
        conversationId: data.conversationId,
        userId: user.userId,
      });
    }
  });

  socket.on('messenger:react', async (data: { messageId: string; emoji: string }) => {
    if (!data?.messageId || !data.emoji) return;

    const rate = await checkRateLimit(`messenger:react:${user.userId}`, REACTION_LIMIT, REACTION_WINDOW_SECONDS);
    if (!rate.allowed) {
      socketEmit(socket, 'messenger:error', { code: 'RATE_LIMITED', event: 'react', retryAfter: rate.retryAfterSeconds });
      return;
    }

    try {
      const result = await conversationService.addReaction({
        userId: user.userId,
        messageId: data.messageId,
        emoji: data.emoji as never,
      });
      const context = await conversationService.getConversationContext(
        user.userId,
        result.conversationId,
        result.conversationType,
      );
      for (const roomId of context.roomIds) {
        io.to(roomId).emit('messenger:reaction_updated', {
          messageId: result.messageId,
          reactions: result.reactions,
        });
      }
    } catch (error) {
      socketEmit(socket, 'messenger:error', {
        code: error instanceof Error && 'code' in error ? String((error as { code?: unknown }).code ?? 'REACTION_ERROR') : 'REACTION_ERROR',
        message: error instanceof Error ? error.message : 'Unable to update reaction.',
      });
    }
  });

  socket.on('messenger:mark_read', async (data: { conversationId: string; conversationType: unknown; lastReadMessageId?: string }) => {
    if (!data?.conversationId || !isConversationType(data.conversationType)) return;

    try {
      const result = await conversationService.markConversationRead({
        userId: user.userId,
        conversationId: data.conversationId,
        conversationType: data.conversationType,
        lastReadMessageId: data.lastReadMessageId,
      });

      const context = await conversationService.getConversationContext(
        user.userId,
        data.conversationId,
        data.conversationType,
      );
      for (const roomId of context.roomIds) {
        socket.to(roomId).except(socket.id).emit('messenger:messages_read', {
          conversationId: data.conversationId,
          lastReadMessageId: data.lastReadMessageId ?? null,
          readBy: user.userId,
          readAt: new Date().toISOString(),
          updatedCount: result.updatedCount,
        });
      }

      const total = await conversationService.getTotalUnread(user.userId);
      socketEmit(socket, 'messenger:unread_total_updated', { total });
    } catch {
      socketEmit(socket, 'messenger:error', { code: 'READ_ERROR', message: 'Unable to mark messages as read.' });
    }
  });

  socket.on('messenger:delete_message', async (data: { messageId: string }) => {
    if (!data?.messageId) return;
    try {
      const result = await conversationService.deleteMessage({
        userId: user.userId,
        messageId: data.messageId,
      });
      const context = await conversationService.getConversationContext(
        user.userId,
        result.conversationId,
        result.conversationType,
      );
      for (const roomId of context.roomIds) {
        io.to(roomId).emit('messenger:message_deleted', {
          messageId: result.messageId,
          conversationId: result.conversationId,
          deletedAt: result.deletedAt.toISOString(),
        });
      }
    } catch (error) {
      socketEmit(socket, 'messenger:error', {
        code: error instanceof Error && 'code' in error ? String((error as { code?: unknown }).code ?? 'DELETE_ERROR') : 'DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Unable to delete message.',
      });
    }
  });

  socket.on('messenger:unsend_message', async (data: { messageId: string }) => {
    if (!data?.messageId) return;
    try {
      const result = await conversationService.unsendMessage({
        userId: user.userId,
        messageId: data.messageId,
      });
      const context = await conversationService.getConversationContext(
        user.userId,
        result.conversationId,
        result.conversationType,
      );
      for (const roomId of context.roomIds) {
        io.to(roomId).emit('messenger:message_unsent', {
          messageId: result.messageId,
          conversationId: result.conversationId,
          unsentAt: result.unsentAt.toISOString(),
        });
      }
    } catch (error) {
      socketEmit(socket, 'messenger:error', {
        code: error instanceof Error && 'code' in error ? String((error as { code?: unknown }).code ?? 'UNSEND_ERROR') : 'UNSEND_ERROR',
        message: error instanceof Error ? error.message : 'Unable to unsend message.',
      });
    }
  });

  socket.on('messenger:delete_conversation', async (data: { conversationId: string; conversationType: unknown }) => {
    if (!data?.conversationId || !isConversationType(data.conversationType)) return;
    try {
      const result = await conversationService.deleteConversation({
        userId: user.userId,
        conversationId: data.conversationId,
        conversationType: data.conversationType,
      });
      const context = await conversationService.getConversationContext(
        user.userId,
        data.conversationId,
        data.conversationType,
      );
      for (const roomId of context.roomIds) {
        io.to(roomId).except(socket.id).emit('messenger:conversation_cleared', {
          conversationId: data.conversationId,
          conversationType: data.conversationType,
        });
      }
      await conversationService.publishUnreadTotals(io, result.participantIds);
      await conversationService.publishConversationUpdated(io, result.participantIds, data.conversationId);
    } catch (error) {
      socketEmit(socket, 'messenger:error', {
        code: error instanceof Error && 'code' in error ? String((error as { code?: unknown }).code ?? 'DELETE_CONVERSATION_ERROR') : 'DELETE_CONVERSATION_ERROR',
        message: error instanceof Error ? error.message : 'Unable to delete conversation.',
      });
    }
  });

  socket.on('messenger:edit_message', async (data: { messageId: string; content: string }) => {
    if (!data?.messageId || !data.content) return;

    const rate = await checkRateLimit(`messenger:edit:${user.userId}`, EDIT_LIMIT, EDIT_WINDOW_SECONDS);
    if (!rate.allowed) {
      socketEmit(socket, 'messenger:error', { code: 'RATE_LIMITED', event: 'edit_message', retryAfter: rate.retryAfterSeconds });
      return;
    }

    try {
      const result = await conversationService.editMessage({
        userId: user.userId,
        messageId: data.messageId,
        content: data.content,
      });
      const context = await conversationService.getConversationContext(
        user.userId,
        result.conversationId,
        result.conversationType,
      );
      for (const roomId of context.roomIds) {
        io.to(roomId).emit('messenger:message_edited', {
          messageId: result.messageId,
          conversationId: result.conversationId,
          content: result.content,
          editedAt: result.editedAt.toISOString(),
        });
      }
    } catch (error) {
      socketEmit(socket, 'messenger:error', {
        code: error instanceof Error && 'code' in error ? String((error as { code?: unknown }).code ?? 'EDIT_ERROR') : 'EDIT_ERROR',
        message: error instanceof Error ? error.message : 'Unable to edit message.',
      });
    }
  });

  socket.on('disconnect', () => {
    for (const [key, timer] of typingTimers) {
      if (key.startsWith(`${user.userId}:`)) {
        clearTimeout(timer);
        typingTimers.delete(key);
      }
    }
  });
}
