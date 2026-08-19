import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../context/SocketContext';
import { useMessengerStore } from '../../stores/messengerStore';
import type { MessengerMessage } from '../../types/messenger.types';

export function MessengerProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const store = useMessengerStore;

  useEffect(() => {
    const current = store.getState();
    current.setCurrentUser(user?._id ?? null);
    if (!user) {
      current.reset();
      current.setSocket(null);
      return;
    }
    current.setSocket(socket);
    if (socket) {
      void current.fetchConversations();
    }
  }, [user, socket, store]);

  useEffect(() => {
    if (!socket || !user) return;

    const storeApi = useMessengerStore;

    const onMessageReceived = (payload: { message: MessengerMessage }) => {
      const state = storeApi.getState();
      state.addMessage(payload.message);
      const isActive = state.activeConversationId === payload.message.conversationId;
      if (!payload.message.isMine) {
        if (isActive) {
          state.markRead(payload.message.conversationId, payload.message.conversationType);
        } else {
          state.setUnreadTotal(state.unreadTotal + 1);
        }
      }
    };

    const onConversationUpdated = (payload: { conversation: MessengerMessage }) => {
      useMessengerStore.getState().upsertConversation(payload.conversation as never);
    };

    const onUserTyping = (payload: { conversationId: string; userId: string }) => {
      useMessengerStore.getState().setTypingUser(payload.conversationId, payload.userId, true);
    };

    const onUserStoppedTyping = (payload: { conversationId: string; userId: string }) => {
      useMessengerStore.getState().setTypingUser(payload.conversationId, payload.userId, false);
    };

    const onReactionUpdated = (payload: { messageId: string; reactions: MessengerMessage['reactions'] }) => {
      useMessengerStore.getState().setReactions(payload.messageId, payload.reactions);
    };

    const onMessageEdited = (payload: { messageId: string; content: string; editedAt: string }) => {
      useMessengerStore.getState().updateMessage(payload.messageId, {
        content: payload.content,
        editedAt: payload.editedAt,
      });
    };

    const onMessageDeleted = (payload: { messageId: string }) => {
      useMessengerStore.getState().removeMessage(payload.messageId);
    };

    const onMessageUnsent = (payload: { messageId: string }) => {
      useMessengerStore.getState().removeMessageCompletely(payload.messageId);
    };

    const onConversationCleared = (payload: { conversationId: string; conversationType: string }) => {
      const state = storeApi.getState();
      const key = `${payload.conversationType}:${payload.conversationId}`;
      const nextMessages = { ...state.messagesByConversation };
      delete nextMessages[key];
      const nextCursor = { ...state.nextCursorByConversation };
      delete nextCursor[key];
      const nextHasMore = { ...state.hasMoreByConversation };
      delete nextHasMore[key];
      useMessengerStore.setState({
        messagesByConversation: nextMessages,
        nextCursorByConversation: nextCursor,
        hasMoreByConversation: nextHasMore,
      });
    };

    const onMessagesRead = (payload: { conversationId: string; readBy: string; readAt: string }) => {
      const state = storeApi.getState();
      for (const [key, messages] of Object.entries(state.messagesByConversation)) {
        const [type, id] = key.split(':') as [string, string];
        if (id === payload.conversationId && type === 'skill') {
          const updated = messages.map((m) =>
            m.senderId === payload.readBy && m.status !== 'read'
              ? { ...m, status: 'read' as const, readAt: payload.readAt }
              : m,
          );
          useMessengerStore.setState({
            messagesByConversation: { ...state.messagesByConversation, [key]: updated },
          });
        }
      }
      useMessengerStore.setState({
        conversations: state.conversations.map((c) =>
          c.conversationId === payload.conversationId ? { ...c, unreadCount: 0 } : c,
        ),
      });
    };

    const onUnreadTotalUpdated = (payload: { total: number }) => {
      useMessengerStore.getState().setUnreadTotal(payload.total);
    };

    const onPresenceUpdate = (payload: { userId: string; isOnline: boolean; lastSeen?: string }) => {
      const state = storeApi.getState();
      useMessengerStore.setState({
        conversations: state.conversations.map((c) => ({
          ...c,
          participants: c.participants.map((p) =>
            p.userId === payload.userId
              ? { ...p, isOnline: payload.isOnline, lastSeen: payload.lastSeen ?? p.lastSeen }
              : p,
          ),
        })),
      });
    };

    const onError = (payload: { code: string; message?: string }) => {
      useMessengerStore.getState().setError(payload.message ?? payload.code);
    };

    socket.on('messenger:message_received', onMessageReceived);
    socket.on('messenger:conversation_updated', onConversationUpdated);
    socket.on('messenger:user_typing', onUserTyping);
    socket.on('messenger:user_stopped_typing', onUserStoppedTyping);
    socket.on('messenger:reaction_updated', onReactionUpdated);
    socket.on('messenger:message_edited', onMessageEdited);
    socket.on('messenger:message_deleted', onMessageDeleted);
    socket.on('messenger:message_unsent', onMessageUnsent);
    socket.on('messenger:conversation_cleared', onConversationCleared);
    socket.on('messenger:messages_read', onMessagesRead);
    socket.on('messenger:unread_total_updated', onUnreadTotalUpdated);
    socket.on('messenger:presence_update', onPresenceUpdate);
    socket.on('messenger:error', onError);

    return () => {
      socket.off('messenger:message_received', onMessageReceived);
      socket.off('messenger:conversation_updated', onConversationUpdated);
      socket.off('messenger:user_typing', onUserTyping);
      socket.off('messenger:user_stopped_typing', onUserStoppedTyping);
      socket.off('messenger:reaction_updated', onReactionUpdated);
      socket.off('messenger:message_edited', onMessageEdited);
      socket.off('messenger:message_deleted', onMessageDeleted);
      socket.off('messenger:message_unsent', onMessageUnsent);
      socket.off('messenger:conversation_cleared', onConversationCleared);
      socket.off('messenger:messages_read', onMessagesRead);
      socket.off('messenger:unread_total_updated', onUnreadTotalUpdated);
      socket.off('messenger:presence_update', onPresenceUpdate);
      socket.off('messenger:error', onError);
    };
  }, [socket, user]);

  return <>{children}</>;
}
