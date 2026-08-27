import clsx from 'clsx';
import { FiVolumeX, FiMapPin } from 'react-icons/fi';
import type { ConversationSummary } from '../../types/messenger.types';
import { formatConversationTime } from './format';

interface ConversationItemProps {
  conversation: ConversationSummary;
  currentUserId: string | null;
  isActive: boolean;
  onOpen: () => void;
  onDeleteChat?: () => void;
}

function titleFor(conversation: ConversationSummary, currentUserId: string | null): string {
  const other = conversation.participants.find((p) => p.userId !== currentUserId) ?? conversation.participants[0];
  return other?.displayName ?? 'Chat';
}

function previewFor(conversation: ConversationSummary, currentUserId: string | null): string {
  const last = conversation.lastMessage;
  if (!last) return 'No messages yet';
  const prefix = last.senderId === currentUserId ? 'You: ' : '';
  if (last.isDeleted) return `${prefix}Message deleted`;
  if (last.type === 'image') return `${prefix}📷 Photo`;
  if (last.type === 'gif') return `${prefix}🎞️ GIF`;
  if (last.type === 'voice_note') return `${prefix}🎤 Voice note`;
  return prefix + (last.content ?? '');
}

function Avatar({ conversation, currentUserId, size = 'md' }: { conversation: ConversationSummary; currentUserId: string | null; size?: 'sm' | 'md' }) {
  const dims = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const ring = size === 'sm' ? 'ring-1' : 'ring-2';
  const other = conversation.participants.find((p) => p.userId !== currentUserId) ?? conversation.participants[0];
  if (other?.avatarUrl) {
    return (
      <span className="relative shrink-0">
        <img src={other.avatarUrl} alt={other.displayName} className={clsx('rounded-full object-cover', dims, ring, 'ring-white/12')} />
        {other.isOnline && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#12161e] bg-emerald-400" aria-label="Online" />}
      </span>
    );
  }
  return (
    <span className="relative shrink-0">
      <span className={clsx('flex items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)]', dims, ring, 'ring-white/12')}>
        {(other?.displayName ?? '?').charAt(0).toUpperCase()}
      </span>
      {other?.isOnline && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#12161e] bg-emerald-400" aria-label="Online" />}
    </span>
  );
}

export function ConversationItem({ conversation, currentUserId, isActive, onOpen, onDeleteChat }: ConversationItemProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      onContextMenu={(e) => {
        e.preventDefault();
        onDeleteChat?.();
      }}
      title={onDeleteChat ? 'Right-click to delete chat' : undefined}
      className={clsx(
        'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all duration-150',
        isActive
          ? 'bg-[color-mix(in_srgb,var(--bubble-accent-from)_14%,transparent)] border border-[color-mix(in_srgb,var(--bubble-accent-from)_26%,transparent)]'
          : 'hover:bg-white/6',
      )}
      aria-current={isActive ? 'true' : undefined}
    >
      <Avatar conversation={conversation} currentUserId={currentUserId} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {titleFor(conversation, currentUserId)}
          </span>
          {conversation.isPinned && <FiMapPin className="h-3 w-3 shrink-0 text-slate-400" />}
          {conversation.isMuted && <FiVolumeX className="h-3 w-3 shrink-0 text-slate-400" />}
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-300">
          {previewFor(conversation, currentUserId)}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
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
    </button>
  );
}