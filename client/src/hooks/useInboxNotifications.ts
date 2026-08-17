import { useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import toast from 'react-hot-toast';

export interface InboxNotificationEvent {
  senderId: string;
  connectionId: string;
  senderName: string;
  preview: string;
  timestamp: string;
}

interface UseInboxNotificationsOptions {
  onNotification?: (event: InboxNotificationEvent) => void;
  showToast?: boolean;
}

/**
 * Hook to listen for real-time inbox notifications via socket.io
 * Shows toast notifications and calls callback when new inbox messages arrive.
 */
export function useInboxNotifications(options: UseInboxNotificationsOptions = {}) {
  const { onNotification, showToast = true } = options;
  const { socket } = useSocket();

  const handleInboxNotification = useCallback((event: InboxNotificationEvent) => {
    if (showToast) {
      toast.success(`${event.senderName}: ${event.preview}`, {
        duration: 4000,
        icon: '💬',
      });
    }
    onNotification?.(event);
  }, [onNotification, showToast]);

  useEffect(() => {
    if (!socket) return;

    socket.on('inbox:message_received', handleInboxNotification);

    return () => {
      socket.off('inbox:message_received', handleInboxNotification);
    };
  }, [socket, handleInboxNotification]);
}
