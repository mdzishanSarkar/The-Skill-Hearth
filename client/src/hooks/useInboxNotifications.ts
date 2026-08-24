import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';
import { useMessengerStore } from '../stores/messengerStore';
import toast from 'react-hot-toast';
import { playMessageSound } from '../utils/notificationSound';

export interface InboxNotificationEvent {
  senderId: string;
  conversationId: string;
  conversationType: 'skill' | 'friend';
  senderName: string;
  preview: string;
  timestamp: string;
}

interface UseInboxNotificationsOptions {
  onNotification?: (event: InboxNotificationEvent) => void;
  showToast?: boolean;
}

/** Collapse duplicate deliveries (dual room joins, double-mounted listeners). */
const recentToasts = new Map<string, number>();
const recentSoundMessages = new Set<string>();

function shouldToast(key: string): boolean {
  const now = Date.now();
  if (now - (recentToasts.get(key) ?? 0) < 2000) return false;
  recentToasts.set(key, now);
  if (recentToasts.size > 100) {
    const oldest = recentToasts.keys().next().value;
    if (oldest !== undefined) recentToasts.delete(oldest);
  }
  return true;
}

function showMessageToast(senderName: string, preview: string, dedupeKey: string) {
  if (!shouldToast(dedupeKey)) return;
  toast.success(`${senderName}: ${preview}`, {
    duration: 4000,
    icon: '💬',
  });
}

function playLegacyMessageSound(messageId: string, senderId: string | undefined, currentUserId: string | undefined) {
  if (senderId && senderId === currentUserId) return;
  if (recentSoundMessages.has(messageId)) return;
  recentSoundMessages.add(messageId);
  if (recentSoundMessages.size > 300) {
    const oldest = recentSoundMessages.values().next().value;
    if (oldest !== undefined) recentSoundMessages.delete(oldest);
  }
  playMessageSound();
}

/**
 * Global listener for real-time message traffic across every chat surface:
 * - legacy skill-chat notifications (`inbox:message_received`)
 * - the Messenger skill chats (`messenger:message_received`)
 * - friend direct messages (`dm:message`)
 *
 * Plays the Messenger-style pop tone and surfaces a toast popup when the
 * conversation is not already front-and-center.
 */
export function useInboxNotifications(options: UseInboxNotificationsOptions = {}) {
  const { onNotification, showToast = true } = options;
  const { socket } = useSocket();
  const { user } = useAuth();
  const { pathname } = useLocation();

  const handleInboxNotification = useCallback(
    (event: InboxNotificationEvent) => {
      playMessageSound();
      if (showToast) {
        showMessageToast(event.senderName, event.preview, `inbox:${event.conversationId}:${event.timestamp}`);
      }
      onNotification?.(event);
    },
    [onNotification, showToast],
  );

  useEffect(() => {
    if (!socket) return;

    // Modern Messenger skill chats: these were previously silent.
    const handleMessengerMessage = (payload: {
      message: {
        _id?: string;
        conversationId: string;
        senderId: string;
        senderName: string;
        content: string | null;
        createdAt: string;
        isMine: boolean;
      };
    }) => {
      const message = payload.message;
      if (message.senderId === user?._id) return;

      const messageKey = message._id ?? `${message.conversationId}:${message.createdAt}`;
      playLegacyMessageSound(messageKey, message.senderId, user?._id);

      const state = useMessengerStore.getState();
      const isActiveConversation =
        state.activeConversationId === message.conversationId && !document.hidden;
      if (!isActiveConversation) {
        const preview = message.content?.slice(0, 80) ?? 'Sent a GIF';
        showMessageToast(
          message.senderName,
          preview,
          `messenger:${message.conversationId}:${message._id ?? message.createdAt}`,
        );
      }
    };

    const handleLegacyMessage = (payload: {
      message?: {
        _id?: string;
        connectionId?: string;
        senderId?: string | { _id: string };
        content?: string;
        createdAt?: string;
      };
      _id?: string;
      connectionId?: string;
      senderId?: string | { _id: string };
      content?: string;
      createdAt?: string;
    }) => {
      const message = payload.message ?? payload;
      const senderId = typeof message.senderId === 'object' ? message.senderId._id : message.senderId;
      const messageKey = message._id ?? `${message.connectionId ?? 'inbox'}:${message.createdAt ?? message.content ?? Date.now()}`;
      playLegacyMessageSound(messageKey, senderId, user?._id);
    };

    // Friend direct messages: these were previously silent outside the DM page.
    const handleDmMessage = (payload: {
      message: { _id?: string; content: string };
      conversationId: string;
      sender: { _id: string; displayName: string };
    }) => {
      if (!user || payload.sender._id === user._id) return;

      playMessageSound();

      const viewingThread = pathname.startsWith('/dm/') && !document.hidden;
      if (!viewingThread) {
        showMessageToast(
          payload.sender.displayName,
          payload.message.content.slice(0, 80),
          `dm:${payload.message._id ?? payload.conversationId}`,
        );
      }
    };

    socket.on('inbox:message_received', handleInboxNotification);
    socket.on('message:new', handleLegacyMessage);
    socket.on('new_message', handleLegacyMessage);
    socket.on('messenger:message_received', handleMessengerMessage);
    socket.on('dm:message', handleDmMessage);

    return () => {
      socket.off('inbox:message_received', handleInboxNotification);
      socket.off('message:new', handleLegacyMessage);
      socket.off('new_message', handleLegacyMessage);
      socket.off('messenger:message_received', handleMessengerMessage);
      socket.off('dm:message', handleDmMessage);
    };
  }, [socket, handleInboxNotification, user, pathname]);
}
