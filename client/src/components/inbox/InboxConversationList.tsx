import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { FiMapPin, FiVolume2, FiVolumeX } from 'react-icons/fi';
import type { InboxConversation } from '../../types/inbox.types';
import { formatConversationTime } from '../messenger/format';

interface InboxConversationListProps {
  conversations: InboxConversation[];
  currentUserId: string | null;
  pendingActionId?: string | null;
  onTogglePin: (conversation: InboxConversation) => void;
  onToggleMute: (conversation: InboxConversation) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Cooking': '#F97316',
  Gardening: '#22C55E',
  'Home & Repair': '#3B82F6',
  Crafts: '#EC4899',
  Digital: '#8B5CF6',
  Wellness: '#14B8A6',
  Language: '#F59E0B',
  'Arts & Music': '#EF4444',
  Sports: '#10B981',
  General: '#64748B',
};

function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.General;
}

function previewFor(conversation: InboxConversation, currentUserId: string | null): string {
  const last = conversation.lastMessage;
  const prefix = last && last.senderId === currentUserId ? 'You: ' : '';
  const preview = !last
    ? 'No messages yet'
    : last.isDeleted
      ? 'Message deleted'
      : last.type === 'image'
        ? '📷 Photo'
        : last.content || 'No messages yet';
  return `${conversation.skill.name} · ${prefix}${preview}`;
}

export default function InboxConversationList({
  conversations,
  currentUserId,
  pendingActionId,
  onTogglePin,
  onToggleMute,
}: InboxConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <span className="text-3xl">🔥</span>
        <p className="text-sm font-medium text-slate-200">No conversations yet.</p>
        <p className="text-xs text-slate-500">Accept a skill connection to start chatting.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-1 px-1">
      {conversations.map((conversation) => {
        const busy = pendingActionId === conversation.connectionId;

        return (
          <li key={conversation.connectionId} className="group relative">
            <div
              className={clsx(
                'flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 transition-all duration-150 hover:bg-white/6',
                busy && 'opacity-60',
              )}
            >
              <Link
                to={`/messages?conversationId=${encodeURIComponent(conversation.connectionId)}&type=skill`}
                className="shrink-0"
                aria-label={`Open chat with ${conversation.otherUser.displayName}`}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-md shadow-black/20 ring-2 ring-white/12"
                  style={{ backgroundColor: categoryColor(conversation.skill.category) }}
                >
                  {(conversation.skill.name || 'S').charAt(0).toUpperCase()}
                </span>
              </Link>

              <Link
                to={`/messages?conversationId=${encodeURIComponent(conversation.connectionId)}&type=skill`}
                className="min-w-0 flex-1"
              >
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {conversation.otherUser.displayName || 'Unknown user'}
                  </span>
                  {conversation.isPinned && <FiMapPin className="h-3 w-3 shrink-0 text-slate-400" />}
                  {conversation.isMuted && <FiVolumeX className="h-3 w-3 shrink-0 text-slate-400" />}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-300">
                  {previewFor(conversation, currentUserId)}
                </p>
              </Link>

              <div className="flex shrink-0 flex-col items-end gap-1 transition group-hover:opacity-0">
                {conversation.lastMessage && (
                  <span className="text-[10px] text-slate-400">
                    {formatConversationTime(conversation.lastMessage.createdAt)}
                  </span>
                )}
                {conversation.unreadCount > 0 && (
                  <span
                    className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--bubble-accent-to)] px-1.5 text-[10px] font-bold text-white shadow-md shadow-[color-mix(in_srgb,var(--bubble-accent-to)_40%,transparent)]"
                    aria-label={`${conversation.unreadCount} unread messages`}
                  >
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </span>
                )}
              </div>

              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onTogglePin(conversation)}
                  disabled={busy}
                  aria-label={conversation.isPinned ? 'Unpin conversation' : 'Pin conversation'}
                  title={conversation.isPinned ? 'Unpin' : 'Pin'}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/6 text-slate-300 transition hover:bg-white/12 hover:text-white"
                >
                  <FiMapPin className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleMute(conversation)}
                  disabled={busy}
                  aria-label={conversation.isMuted ? 'Unmute conversation' : 'Mute conversation'}
                  title={conversation.isMuted ? 'Unmute' : 'Mute'}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/6 text-slate-300 transition hover:bg-white/12 hover:text-white"
                >
                  {conversation.isMuted ? <FiVolume2 className="h-4 w-4" /> : <FiVolumeX className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
