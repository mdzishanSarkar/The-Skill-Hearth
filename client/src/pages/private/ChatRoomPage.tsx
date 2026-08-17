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
    <div className="flex h-[calc(100dvh-64px)] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-emerald-500/10 via-white to-violet-500/10 px-4 py-3 dark:border-slate-800 dark:from-emerald-500/10 dark:via-slate-950 dark:to-violet-500/10">
          <Link to="/messages" className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">
            ←
          </Link>

          <div className="relative">
            <Avatar
              src={other?.avatar || undefined}
              name={other?.displayName || 'User'}
              size="sm"
            />
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {other?.displayName || 'Unknown'}
            </p>
            {skill && (
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{skill.skillName}</p>
            )}
          </div>

          <form onSubmit={handleSearch} className="hidden items-center gap-2 md:flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-36 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500 lg:w-48"
            />
            <Button type="submit" variant="secondary" size="sm" loading={searching}>
              Search
            </Button>
          </form>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
            className="rounded-full"
          >
            {showSidebar ? 'Hide' : 'Session tools'}
          </Button>

          <Link
            to={`/connection/${connection._id}`}
            className="text-xs font-medium text-violet-600 transition hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
          >
            Details
          </Link>
        </div>

        {searchResults.length > 0 && (
          <div className="border-b border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
              {searchResults.length} result{searchResults.length === 1 ? '' : 's'} for "{searchQuery}"
            </p>
            <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {searchResults.map((msg) => (
                <p key={msg._id} className="truncate text-xs text-amber-700 dark:text-amber-300">
                  {msg.content}
                </p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => { setSearchResults([]); setSearchQuery(''); }}
              className="mt-1 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
            >
              Clear results
            </button>
          </div>
        )}

        <ChatWindow connection={connection} />
      </div>

      {showSidebar && (
        <div className="w-80 shrink-0 border-l border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="space-y-4 overflow-y-auto">
            <SessionNotes connectionId={connection._id} />
            <div className="mt-4">
              <SchedulePicker connectionId={connection._id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
