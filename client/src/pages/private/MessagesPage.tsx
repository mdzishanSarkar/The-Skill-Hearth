import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getActiveChats, getOutbox, withdrawRequest } from '../../services/connections';
import { setInboxPreference } from '../../services/inbox';
import { useInboxConversations } from '../../hooks/useInboxConversations';
import type { InboxFilter } from '../../types/inbox.types';
import type { Connection } from '../../types/connection.types';
import { getApiError } from '../../types/api.types';
import { useAuth } from '../../hooks/useAuth';
import ChatList from '../../components/chat/ChatList';
import InboxConversationList from '../../components/inbox/InboxConversationList';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { FiMessageCircle, FiInbox, FiSend, FiSearch, FiPlus } from 'react-icons/fi';
import { showError, showSuccess } from '../../utils/toast';

type MessagesTab = 'chats' | 'received' | 'sent';

const FILTER_OPTIONS: { label: string; value: InboxFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Pinned', value: 'pinned' },
  { label: 'Archived', value: 'archived' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'amber',
  accepted: 'green',
  rejected: 'red',
  completed: 'blue',
  withdrawn: 'gray',
  cancelled: 'gray',
};

const TABS: { id: MessagesTab; label: string; icon: React.ReactNode }[] = [
  { id: 'chats', label: 'Chats', icon: <FiMessageCircle className="h-4 w-4" /> },
  { id: 'received', label: 'Received', icon: <FiInbox className="h-4 w-4" /> },
  { id: 'sent', label: 'Sent', icon: <FiSend className="h-4 w-4" /> },
];

export default function MessagesPage() {
  const [tab, setTab] = useState<MessagesTab>('chats');

  return (
    <div className="page-shell animate-fade-in py-8">
      <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-gradient-to-r from-emerald-500/10 via-white to-violet-500/10 p-5 shadow-sm dark:border-slate-800 dark:from-emerald-500/10 dark:via-slate-950 dark:to-violet-500/10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
            <FiMessageCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Inbox</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Messages</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400">
            <FiSearch className="h-4 w-4" />
            <span>Search conversations</span>
          </div>
          <Button className="rounded-full">
            <FiPlus className="h-4 w-4" />
            New chat
          </Button>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === id
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 dark:bg-violet-500 dark:shadow-violet-900/30'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === 'chats' && <ChatsTab />}
          {tab === 'received' && <ReceivedTab />}
          {tab === 'sent' && <SentTab />}
        </div>
      </div>
    </div>
  );
}

function ChatsTab() {
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
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-900/60">
      {connections.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
          <EmptyState
            icon={<FiMessageCircle />}
            title="No active chats"
            description="When a session request is accepted, your chat with that person will appear here."
          />
        </div>
      ) : (
        <ChatList connections={connections} currentUserId={me?._id || ''} />
      )}
    </div>
  );
}

function ReceivedTab() {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { conversations, page, setPage, filter, setFilter, totalPages, totalUnread, isLoading, error, refresh } = useInboxConversations(1, 'all');

  async function handleTogglePin(connectionId: string) {
    const conv = conversations.find((c) => c.connectionId === connectionId);
    if (!conv) return;

    setTogglingId(connectionId);
    try {
      const action = conv.isPinned ? 'unpin' : 'pin';
      await setInboxPreference(connectionId, action);
      showSuccess(action === 'pin' ? 'Pinned' : 'Unpinned');
      await refresh();
    } catch {
      showError('Failed to update conversation');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleToggleMute(connectionId: string) {
    const conv = conversations.find((c) => c.connectionId === connectionId);
    if (!conv) return;

    setTogglingId(connectionId);
    try {
      const action = conv.isMuted ? 'unmute' : 'mute';
      await setInboxPreference(connectionId, action);
      showSuccess(action === 'mute' ? 'Muted' : 'Unmuted');
      await refresh();
    } catch {
      showError('Failed to update conversation');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {totalUnread > 0 ? `${totalUnread} unread message${totalUnread === 1 ? '' : 's'}` : 'All caught up'}
        </p>

        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map(({ label, value }) => (
            <Button
              key={value}
              variant={filter === value ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setFilter(value);
                setPage(1);
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {error}
          <Button size="sm" variant="secondary" className="mt-2" onClick={() => void refresh()}>
            Retry
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="md" />
        </div>
      ) : (
        <>
          <InboxConversationList
            conversations={conversations}
            onTogglePin={togglingId ? undefined : handleTogglePin}
            onToggleMute={togglingId ? undefined : handleToggleMute}
          />

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="self-center text-sm text-slate-600 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SentTab() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getOutbox(page);
      setConnections(result.connections);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleWithdraw(id: string) {
    if (!window.confirm('Withdraw this request?')) return;
    setActionId(id);
    try {
      await withdrawRequest(id);
      showSuccess('Request withdrawn');
      await load();
    } catch (err) {
      showError(getApiError(err));
    } finally {
      setActionId(null);
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
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {connections.length === 0 ? (
        <EmptyState
          icon={<FiSend />}
          title="No sent requests"
          description="Your outgoing skill requests will appear here."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {connections.map((conn) => {
            const teacher = typeof conn.teacherId === 'object' ? conn.teacherId : null;
            const skill = typeof conn.skillId === 'object' ? conn.skillId : null;
            return (
              <div key={conn._id} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={teacher?.avatar || undefined}
                      name={teacher?.displayName || 'Teacher'}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <Link
                        to={`/profile/${teacher?._id || ''}`}
                        className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600"
                      >
                        {teacher?.displayName || 'Unknown'}
                      </Link>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {skill?.skillName || 'Skill'} {skill?.categoryName ? `(${skill.categoryName})` : ''}
                      </p>
                    </div>
                  </div>
                  <Badge color={STATUS_COLORS[conn.status] as 'amber' | 'green' | 'red' | 'blue' | 'gray'}>
                    {conn.status}
                  </Badge>
                </div>

                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{conn.message}</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Format: {conn.proposedFormat} · {new Date(conn.createdAt).toLocaleDateString()}
                </p>

                {conn.responseMessage && (
                  <p className="mt-2 rounded-md bg-slate-50 p-2 text-xs text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                    Response: {conn.responseMessage}
                  </p>
                )}

                {conn.status === 'pending' && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="danger"
                      loading={actionId === conn._id}
                      onClick={() => handleWithdraw(conn._id)}
                    >
                      Withdraw
                    </Button>
                  </div>
                )}

                {conn.status === 'accepted' && (
                  <div className="mt-3 flex gap-2">
                    <Link to={`/chat/${conn._id}`}>
                      <Button size="sm">Open chat</Button>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="self-center text-sm text-slate-500 dark:text-slate-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
