import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  getConversation,
  sendDirectMessage,
  markConversationRead,
} from '../../services/dm.service';
import type { DirectMessage, ConversationResult } from '../../types/dm.types';
import { getApiError } from '../../types/api.types';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

interface SocketDmPayload {
  message: DirectMessage;
  conversationId: string;
  sender: { _id: string; displayName: string; avatar: string };
}

export default function FriendDmPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: me } = useAuth();
  const { socket } = useSocket();
  const [conversation, setConversation] = useState<ConversationResult | null>(null);
  const [otherUser, setOtherUser] = useState<{ _id: string; displayName: string; avatar: string } | null>(null);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    getConversation(userId)
      .then((result) => {
        if (cancelled) return;
        setConversation(result);
      })
      .catch((err) => setError(getApiError(err)))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!me?._id || !userId) return;
    const { _id, displayName, avatar } = me;
    setOtherUser({ _id, displayName, avatar });
  }, [me, userId]);

  useEffect(() => {
    if (!socket || !userId) return;
    socket.emit('dm:join', userId);

    const handleNewDm = (payload: SocketDmPayload) => {
      if (payload.sender._id !== userId) return;
      setConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, payload.message],
          total: prev.total + 1,
        };
      });
      if (payload.sender._id !== me?._id) {
        markConversationRead(userId).catch(() => {});
      }
    };

    socket.on('dm:message', handleNewDm);
    return () => {
      socket.emit('dm:leave', userId);
      socket.off('dm:message', handleNewDm);
    };
  }, [socket, userId, me?._id]);

  useEffect(() => {
    if (!socket || !userId) return;
    markConversationRead(userId).catch(() => {});
  }, [socket, userId, conversation?.messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !content.trim()) return;
    setSending(true);
    try {
      const message = await sendDirectMessage(userId, { content });
      setConversation((prev) => {
        if (!prev) return prev;
        return { ...prev, messages: [...prev.messages, message], total: prev.total + 1 };
      });
      setContent('');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Conversation unavailable</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{error}</p>
        <Link to="/dm" className="mt-6 inline-block">
          <Button variant="secondary">Back to messages</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-64px)] max-w-2xl flex-col px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 py-3">
        <Link to="/dm" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
          &larr;
        </Link>
        <Avatar src={otherUser?.avatar || undefined} name={otherUser?.displayName || 'User'} size="sm" />
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{otherUser?.displayName || 'Friend'}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {conversation?.messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-gray-400 dark:text-gray-500">No messages yet. Say hello!</p>
        )}
        {conversation?.messages.map((message) => {
          const isOwn = message.senderId === me?._id;
          return (
            <div key={message._id} className={`mb-3 flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  isOwn ? 'bg-indigo-600 text-white' : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
                }`}
              >
                <p className="break-words whitespace-pre-wrap">{message.content}</p>
                <p className={`mt-1 text-[10px] ${isOwn ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-500'}`}>
                  {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-200 dark:border-gray-700 py-3">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a message…"
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
        />
        <Button type="submit" size="md" loading={sending} disabled={!content.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
