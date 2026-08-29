import { useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiArrowRight, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useInboxConversations } from '../../hooks/useInboxConversations';
import { setInboxPreference } from '../../services/inbox';
import type { InboxConversation, InboxFilter } from '../../types/inbox.types';
import InboxConversationList from '../../components/inbox/InboxConversationList';
import { useAvailableViewportHeight } from '../../hooks/useAvailableViewportHeight';

const FILTERS: { value: InboxFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'pinned', label: 'Pinned' },
  { value: 'archived', label: 'Archived' },
];

function matchesQuery(conversation: InboxConversation, query: string): boolean {
  const haystack = [
    conversation.otherUser.displayName,
    conversation.skill.name,
    conversation.skill.category,
    conversation.lastMessage?.content ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export default function SkillInboxPage() {
  const { user } = useAuth();
  const { ref: viewportRef, height } = useAvailableViewportHeight<HTMLDivElement>();
  const {
    conversations,
    page,
    setPage,
    filter,
    setFilter,
    totalPages,
    totalUnread,
    isLoading,
    error,
    refresh,
  } = useInboxConversations(1, 'all');

  const [query, setQuery] = useState('');
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const trimmedQuery = query.trim().toLowerCase();
  const searching = trimmedQuery.length >= 2;
  const visible = searching ? conversations.filter((c) => matchesQuery(c, trimmedQuery)) : conversations;

  function handleFilterChange(next: InboxFilter) {
    setFilter(next);
    setPage(1);
  }

  async function handlePreference(
    conversation: InboxConversation,
    action: 'pin' | 'unpin' | 'mute' | 'unmute',
  ) {
    setPendingActionId(conversation.connectionId);
    try {
      await setInboxPreference(conversation.connectionId, action);
      await refresh();
    } catch {
      toast.error('Could not update conversation');
    } finally {
      setPendingActionId(null);
    }
  }

  return (
    <div ref={viewportRef} style={{ height }} className="min-h-0 overflow-hidden px-3 py-3 md:px-4">
      <div className="messenger-app-surface flex h-full overflow-hidden rounded-[26px] border border-white/8 bg-[rgba(13,17,23,0.94)] shadow-[0_32px_72px_rgba(2,6,23,0.56)] backdrop-blur-xl">
        <aside
          className="messenger-sidebar flex h-full w-full shrink-0 flex-col border-r border-white/8 bg-[linear-gradient(180deg,_rgba(18,22,30,0.96),_rgba(13,17,23,0.98))] md:w-[380px] lg:w-[420px]"
          aria-label="Skill inbox"
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/8 px-4 pb-3 pt-4">
            <div className="flex items-center gap-2.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Messages</p>
                <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">Skill Inbox</h2>
              </div>
              {totalUnread > 0 && (
                <span
                  className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--bubble-accent-to)] px-1.5 text-[10px] font-bold text-white shadow-md shadow-[color-mix(in_srgb,var(--bubble-accent-to)_40%,transparent)]"
                  aria-label={`${totalUnread} unread messages`}
                >
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-slate-300 transition hover:bg-white/10 hover:text-slate-200"
            >
              Refresh
            </button>
          </div>

          <div className="px-3 pb-3 pt-3">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search conversations…"
                aria-label="Search conversations"
                className="w-full rounded-full border border-white/8 bg-[rgba(255,255,255,0.05)] py-2.5 pl-9 pr-8 text-sm text-white outline-none placeholder:text-slate-500 shadow-inner shadow-black/20 focus:border-blue-400/40 focus:ring-2 focus:ring-blue-400/20 transition"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-3 flex items-center gap-1.5" role="tablist" aria-label="Inbox filters">
              {FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={filter === value}
                  onClick={() => handleFilterChange(value)}
                  className={clsx(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition',
                    filter === value
                      ? 'bg-[color-mix(in_srgb,var(--bubble-accent-from)_18%,transparent)] text-[var(--bubble-accent-from)]'
                      : 'border border-white/8 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-2">
            {error && (
              <p className="px-4 py-2 text-xs text-rose-300" role="alert">
                {error}
              </p>
            )}
            {isLoading && (
              <p className="px-4 py-3 text-sm text-slate-400" role="status">
                Loading conversations…
              </p>
            )}
            {!isLoading && !error && searching && visible.length === 0 && (
              <p className="px-4 py-2 text-xs text-slate-400">No matches found.</p>
            )}
            {!isLoading && !error && !(searching && visible.length === 0) && (
              <InboxConversationList
                conversations={visible}
                currentUserId={user?._id ?? null}
                pendingActionId={pendingActionId}
                onTogglePin={(conversation) =>
                  void handlePreference(conversation, conversation.isPinned ? 'unpin' : 'pin')
                }
                onToggleMute={(conversation) =>
                  void handlePreference(conversation, conversation.isMuted ? 'unmute' : 'mute')
                }
              />
            )}
          </div>

          {totalPages > 1 && !searching && (
            <div className="flex items-center justify-between border-t border-white/8 px-4 py-2 text-[11px] text-slate-400">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  aria-label="Previous page"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <FiArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <FiArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </aside>

        <main className="hidden min-w-0 flex-1 flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_35%)] px-6 text-center md:flex">
          <div className="max-w-md">
            <p className="text-6xl">📬</p>
            <p className="mt-6 text-2xl font-bold text-[var(--text-primary)]">Your Skill Inbox</p>
            <p className="mt-3 text-base text-slate-300">
              Select a skill conversation to open it in Messenger.
            </p>
            <div className="mt-8 rounded-2xl border border-dashed border-blue-400/20 bg-blue-500/6 p-5 text-slate-400 backdrop-blur-sm">
              <p className="text-sm">
                💡 <strong className="text-blue-200">Tip:</strong> Hover a conversation to pin or mute it. Use{' '}
                <FiRefreshCw className="inline h-3 w-3 align-[-1px]" /> Refresh to catch up on new messages.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
