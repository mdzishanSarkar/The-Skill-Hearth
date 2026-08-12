import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getConnection } from '../../services/connections';
import { getApiError } from '../../types/api.types';
import type { Connection } from '../../types/connection.types';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/ui/Avatar';
import ChatWindow from '../../components/chat/ChatWindow';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import SessionNotes from '../../components/session/SessionNotes';
import SchedulePicker from '../../components/session/SchedulePicker';
import { searchMessages } from '../../services/messages';
import type { ChatMessage } from '../../types/message.types';

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getConnection(id)
      .then((conn) => {
        if (conn.status !== 'accepted') {
          setError('Chat is only available for accepted connections.');
        } else {
          setConnection(conn);
        }
      })
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim() || !id) return;
    setSearching(true);
    try {
      const result = await searchMessages(id, searchQuery);
      setSearchResults(result.messages);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-64px)] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !connection) {
    return (
      <div className="flex h-[calc(100dvh-64px)] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Chat unavailable</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{error || 'Connection not found.'}</p>
        <Link to="/messages" className="mt-6">
          <Button variant="secondary">Back to messages</Button>
        </Link>
      </div>
    );
  }

  const other =
    me?._id === (typeof connection.requesterId === 'object' ? connection.requesterId._id : connection.requesterId)
      ? (typeof connection.teacherId === 'object' ? connection.teacherId : null)
      : (typeof connection.requesterId === 'object' ? connection.requesterId : null);

  const skill = typeof connection.skillId === 'object' ? connection.skillId : null;

  return (
    <div className="flex h-[calc(100dvh-64px)]">
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
          <Link to="/messages" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
            &larr;
          </Link>
          <Avatar
            src={other?.avatar || undefined}
            name={other?.displayName || 'User'}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {other?.displayName || 'Unknown'}
            </p>
            {skill && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{skill.skillName}</p>
            )}
          </div>
          <form onSubmit={handleSearch} className="flex gap-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-32 rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none lg:w-48"
            />
            <Button type="submit" variant="secondary" size="sm" loading={searching}>
              Search
            </Button>
          </form>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? 'Hide' : 'Session tools'}
          </Button>
          <Link
            to={`/connection/${connection._id}`}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
          >
            Details
          </Link>
        </div>

        {searchResults.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-700 bg-yellow-50 p-3">
            <p className="text-xs font-medium text-yellow-800">
              {searchResults.length} result{searchResults.length === 1 ? '' : 's'} for "{searchQuery}"
            </p>
            <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {searchResults.map((msg) => (
                <p key={msg._id} className="truncate text-xs text-yellow-700">
                  {msg.content}
                </p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => { setSearchResults([]); setSearchQuery(''); }}
              className="mt-1 text-xs text-yellow-600 hover:text-yellow-800"
            >
              Clear results
            </button>
          </div>
        )}

        <ChatWindow connection={connection} />
      </div>

      {showSidebar && (
        <div className="w-80 shrink-0 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 overflow-y-auto">
          <SessionNotes connectionId={connection._id} />
          <div className="mt-4">
            <SchedulePicker connectionId={connection._id} />
          </div>
        </div>
      )}
    </div>
  );
}
