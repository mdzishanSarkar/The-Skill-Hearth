import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getActiveChats } from '../../services/connections';
import { getApiError } from '../../types/api.types';
import type { Connection } from '../../types/connection.types';
import { useAuth } from '../../hooks/useAuth';
import ChatList from '../../components/chat/ChatList';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

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
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <div className="flex gap-3">
          <Link to="/inbox" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Inbox
          </Link>
          <Link to="/outbox" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Outbox
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        <ChatList connections={connections} currentUserId={me?._id || ''} />
      </div>
    </div>
  );
}
