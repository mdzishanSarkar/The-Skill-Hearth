import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getActiveChats } from '../../services/connections';
import { getApiError } from '../../types/api.types';
import type { Connection } from '../../types/connection.types';
import { useAuth } from '../../hooks/useAuth';
import ChatList from '../../components/chat/ChatList';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { FiMessageCircle } from 'react-icons/fi';

export default function MessagesPage() {
  const { user: me } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getActiveChats()
      .then(setConnections)
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  }, []);

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
        title="Messages"
        subtitle="Chats with your session partners."
        actions={
          <div className="flex gap-3">
            <Link to="/inbox" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Inbox
            </Link>
            <Link to="/outbox" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Outbox
            </Link>
          </div>
        }
      />

      <div className="card mt-6 overflow-hidden">
        <ChatList connections={connections} currentUserId={me?._id || ''} />
      </div>
    </div>
  );
}
