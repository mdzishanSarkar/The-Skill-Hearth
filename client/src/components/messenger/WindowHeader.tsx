import { useState } from 'react';
import clsx from 'clsx';
import { FiX, FiMoreVertical, FiVolume2, FiVolumeX, FiTrash2, FiMapPin } from 'react-icons/fi';
import type { ConversationSummary } from '../../types/messenger.types';
import { useMessengerStore } from '../../stores/messengerStore';
import { formatRelativeSeen } from './format';

interface WindowHeaderProps {
  conversation: ConversationSummary;
  onClose: () => void;
  onToggleMute: () => void;
  onTogglePin: () => void;
  onClearHistory: () => void;
}

function otherParticipant(conversation: ConversationSummary, currentUserId: string | null) {
  return conversation.participants.find((p) => p.userId !== currentUserId) ?? conversation.participants[0];
}

export function WindowHeader({ conversation, onClose, onToggleMute, onTogglePin, onClearHistory }: WindowHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentUserId = useMessengerStore((state) => state.currentUserId);
  const other = otherParticipant(conversation, currentUserId);
  const title =
    conversation.conversationType === 'skill'
      ? conversation.skillContext?.skillName ?? 'Skill chat'
      : other?.displayName ?? 'Chat';

  const status =
    other?.isOnline
      ? 'Active now'
      : other?.lastSeen
        ? `Last seen ${formatRelativeSeen(other.lastSeen)}`
        : 'Offline';

  return (
    <div className="messenger-header relative z-30 flex items-center gap-2.5 overflow-visible border-b border-white/8 px-4 py-3 sm:px-3 sm:py-2.5">
      <div className="relative shrink-0">
        {conversation.conversationType === 'skill' && conversation.skillContext ? (
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg shadow-black/30 ring-2 ring-white/12"
            style={{ backgroundColor: conversation.skillContext.categoryColor }}
          >
            {conversation.skillContext.skillName.charAt(0).toUpperCase()}
          </span>
        ) : other?.avatarUrl ? (
          <img src={other.avatarUrl} alt={other.displayName} className="h-9 w-9 rounded-full object-cover ring-2 ring-white/12" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)] ring-2 ring-white/12">
            {(other?.displayName ?? '?').charAt(0).toUpperCase()}
          </span>
        )}
        <span
          className={clsx(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#191d23]',
            other?.isOnline ? 'bg-emerald-500' : 'bg-[var(--text-tertiary)]',
          )}
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[15px] font-semibold text-[var(--text-primary)] leading-5">{title}</h2>
        <p className="truncate text-[11px] text-slate-300 leading-4">{status}</p>
      </div>

      {conversation.conversationType === 'skill' && conversation.skillContext && (
        <span
          className="hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline-block"
          style={{ color: conversation.skillContext.categoryColor }}
        >
          {conversation.skillContext.skillCategory}
        </span>
      )}

      <div className="relative flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/4 p-1">
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={conversation.isMuted ? 'Unmute conversation' : 'Mute conversation'}
          title={conversation.isMuted ? 'Unmute' : 'Mute'}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/8 hover:text-white"
        >
          {conversation.isMuted ? <FiVolumeX className="h-4 w-4" /> : <FiVolume2 className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Conversation options"
          aria-expanded={menuOpen}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/8 hover:text-white"
        >
          <FiMoreVertical className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close conversation"
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/8 hover:text-white"
        >
          <FiX className="h-4 w-4" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
            <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[rgba(18,22,31,0.98)] py-1.5 shadow-[0_18px_40px_rgba(2,6,23,0.45)] backdrop-blur-xl">
              <button
                type="button"
                onClick={() => {
                  onToggleMute();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-100 hover:bg-white/6"
              >
                {conversation.isMuted ? <FiVolume2 className="h-4 w-4" /> : <FiVolumeX className="h-4 w-4" />}
                {conversation.isMuted ? 'Unmute' : 'Mute notifications'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onTogglePin();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-100 hover:bg-white/6"
              >
                <FiMapPin className="h-4 w-4" />
                {conversation.isPinned ? 'Unpin conversation' : 'Pin conversation'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearHistory();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-300 hover:bg-white/6"
              >
                <FiTrash2 className="h-4 w-4" />
                Clear history
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
