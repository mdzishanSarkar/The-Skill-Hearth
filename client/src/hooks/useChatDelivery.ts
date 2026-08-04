import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useSocket } from './useSocket';
import type { ChatMessage } from '../types/message.types';

export function useChatDelivery() {
  const { user: me } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !me) return;

    const handleNewMessage = (message: ChatMessage) => {
      if (!message || !message.connectionId || message.senderId === me._id) return;
      socket.emit('message:delivered', {
        connectionId: message.connectionId,
        messageId: message._id,
      });
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [socket, me]);
}
