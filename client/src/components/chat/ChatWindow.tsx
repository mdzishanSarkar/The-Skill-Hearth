import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../../types/message.types';
import type { Connection } from '../../types/connection.types';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { getMessages, markAsRead } from '../../services/messages';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import Spinner from '../ui/Spinner';

interface ChatWindowProps {
  connection: Connection;
}

function normalizeMessage(msg: ChatMessage): ChatMessage {
  const senderObject = typeof msg.senderId === 'object' ? msg.senderId : null;
  if (!senderObject) return msg;
  return {
    ...msg,
    senderId: senderObject._id,
    senderName: msg.senderName || senderObject.displayName,
    senderAvatar: msg.senderAvatar || senderObject.avatar,
  };
}

export default function ChatWindow({ connection }: ChatWindowProps) {
  const { user: me } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getMessages(connection._id)
      .then((result) => {
        if (!cancelled) {
          setMessages(result.messages.map(normalizeMessage));
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [connection._id]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('chat:join', connection._id);

    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.connectionId === connection._id) {
        setMessages((prev) => [...prev, normalizeMessage(msg)]);
        if (msg.senderId !== me?._id) {
          socket.emit('message:read', { connectionId: connection._id });
        }
      }
    };

    const handleRead = (data: { connectionId: string; userId: string; readAt: string }) => {
      if (data.connectionId === connection._id && data.userId !== me?._id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === me?._id && !m.readAt
              ? { ...m, readAt: data.readAt }
              : m,
          ),
        );
      }
    };

    const handleDelivered = (data: { messageId: string; deliveredAt: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === data.messageId ? { ...m, deliveredAt: data.deliveredAt } : m,
        ),
      );
    };

    const handleTypingStart = (data: { connectionId: string; displayName: string }) => {
      if (data.connectionId === connection._id) {
        setTypingUser(data.displayName);
      }
    };

    const handleTypingStop = (data: { connectionId: string }) => {
      if (data.connectionId === connection._id) {
        setTypingUser(null);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:read', handleRead);
    socket.on('message:delivered', handleDelivered);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.emit('chat:leave', connection._id);
      socket.off('message:new', handleNewMessage);
      socket.off('message:read', handleRead);
      socket.off('message:delivered', handleDelivered);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, connection._id, me?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  useEffect(() => {
    if (!socket || !connection._id) return;
    markAsRead(connection._id).catch(() => {});
  }, [socket, connection._id, messages.length]);

  function handleSend(content: string) {
    if (!socket) return;
    socket.emit('message:send', { connectionId: connection._id, content });
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={msg.senderId === me?._id}
          />
        ))}
        {typingUser && <TypingIndicator displayName={typingUser} />}
        <div ref={bottomRef} />
      </div>
      <MessageInput onSend={handleSend} disabled={!socket} />
    </div>
  );
}
