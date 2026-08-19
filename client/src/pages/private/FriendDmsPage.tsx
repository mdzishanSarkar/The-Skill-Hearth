import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { getConversations } from '../../services/dm.service';
import type { Conversation } from '../../types/dm.types';
import { getApiError } from '../../types/api.types';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiMessageCircle } from 'react-icons/fi';
import { useSocket } from '../../hooks/useSocket';
import { useFriendPresence } from '../../hooks/useFriendPresence';

export default function FriendDmsPage() {
  const { socket } = useSocket();
  const { isOnline } = useFriendPresence();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setConversations(await getConversations());
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewDm = () => {
      load();
    };
    socket.on('dm:message', handleNewDm);
    return () => {
      socket.off('dm:message', handleNewDm);
    };
  }, [socket]);

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
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiMessageCircle />}
        title="Friend Messages"
        subtitle="DMs with your friends."
        actions={<Link to="/friends" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Friends</Link>}
      />

      <div className="card mt-6 overflow-hidden">
        {conversations.length === 0 ? (
          <EmptyState
            icon={<FiMessageCircle />}
            title="No conversations yet"
            description="Message a friend to get started."
          />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {conversations.map((conversation) => (
              <li key={conversation.otherUserId}>
                <Link
                  to={`/messages?conversationId=${encodeURIComponent(conversation.otherUserId)}&type=friend`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <span className="relative shrink-0">
                    <Avatar src={conversation.otherUser.avatar || undefined} name={conversation.otherUser.displayName} size="md" />
                    {isOnline(conversation.otherUserId) && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 dark:border-gray-900"
                        title="Online now"
                        aria-label="Online now"
                      />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {conversation.otherUser.displayName}
                      </p>
                      <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                        {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={`truncate text-sm ${conversation.unreadCount > 0 ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      {conversation.lastMessage || 'Say hello!'}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-bold text-white">
                      {conversation.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
