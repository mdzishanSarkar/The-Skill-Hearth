import { useEffect, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import type { ConversationSummary } from '../../types/messenger.types';
import { useMessengerStore } from '../../stores/messengerStore';
import { searchConversations } from '../../services/messenger';
import { ConversationList } from './ConversationList';
import { AccentColorPicker } from './AccentColorPicker';
import { ConfirmDialog } from './ConfirmDialog';

export function MessengerSidebar() {
  const conversations = useMessengerStore((state) => state.conversations);
  const currentUserId = useMessengerStore((state) => state.currentUserId);
  const activeConversationId = useMessengerStore((state) => state.activeConversationId);
  const loading = useMessengerStore((state) => state.loadingConversations);
  const fetchConversations = useMessengerStore((state) => state.fetchConversations);
  const openConversation = useMessengerStore((state) => state.openConversation);
  const deleteConversation = useMessengerStore((state) => state.deleteConversation);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ConversationSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ConversationSummary | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      void searchConversations(query, 20)
        .then((res) => setResults(res.conversations))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const visible = query.trim().length >= 2 ? results : conversations;

  return (
    <aside className="messenger-sidebar flex h-full w-full flex-col bg-[linear-gradient(180deg,_rgba(18,22,30,0.96),_rgba(13,17,23,0.98))]" aria-label="Conversations">
      <div className="flex items-center justify-between gap-2 border-b border-white/8 px-4 pb-3 pt-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Chats</p>
          <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">Messenger</h2>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <AccentColorPicker />
          <button
            type="button"
            onClick={() => void fetchConversations()}
            className="rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-slate-300 transition hover:bg-white/10 hover:text-slate-200"
          >
            Refresh
          </button>
        </div>
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
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-2">
        {searching && (
          <p className="px-4 py-2 text-xs text-slate-400" role="status">Searching…</p>
        )}
        {!searching && query.trim().length >= 2 && results.length === 0 && (
          <p className="px-4 py-2 text-xs text-slate-400">No matches found.</p>
        )}
        {!searching && (
          <ConversationList
            conversations={visible}
            currentUserId={currentUserId}
            activeConversationId={activeConversationId}
            onOpen={(conversation) => {
              void openConversation(conversation.conversationId, conversation.conversationType);
            }}
            onDeleteChat={(conversation) => setPendingDelete(conversation)}
          />
        )}
        {loading && conversations.length === 0 && (
          <p className="px-4 py-3 text-sm text-slate-400" role="status">Loading conversations…</p>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete chat?"
        name={
          pendingDelete
            ? pendingDelete.conversationType === 'skill'
              ? pendingDelete.skillContext?.skillName ?? 'Skill chat'
              : (pendingDelete.participants.find((p) => p.userId !== currentUserId)?.displayName ?? 'Chat')
            : undefined
        }
        avatarUrl={
          pendingDelete?.conversationType === 'friend'
            ? pendingDelete.participants.find((p) => p.userId !== currentUserId)?.avatarUrl
            : undefined
        }
        avatarColor={pendingDelete?.conversationType === 'skill' ? pendingDelete.skillContext?.categoryColor : undefined}
        avatarLetter={pendingDelete?.conversationType === 'skill' ? pendingDelete.skillContext?.skillName.charAt(0) : undefined}
        message={
          pendingDelete
            ? 'This chat and all its messages will be removed from your chats for you. This cannot be undone.'
            : ''
        }
        confirmLabel="Delete chat"
        onConfirm={() => {
          if (pendingDelete) {
            deleteConversation(pendingDelete.conversationId, pendingDelete.conversationType);
          }
        }}
        onClose={() => setPendingDelete(null)}
      />
    </aside>
  );
}