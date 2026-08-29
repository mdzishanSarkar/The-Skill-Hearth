import { useCallback, useState } from 'react';
import DOMPurify from 'dompurify';
import clsx from 'clsx';
import {
  FiCornerUpLeft,
  FiEdit2,
  FiTrash2,
  FiSmile,
  FiCopy,
  FiCheck,
  FiUser,
} from 'react-icons/fi';
import type { MessengerMessage, ReactionEmoji } from '../../types/messenger.types';
import { REACTION_EMOJIS } from '../../types/messenger.types';
import { formatMessageTime } from './format';
import { ImageMessage } from './ImageMessage';
import { GifMessage } from './GifMessage';
import { VoiceNoteMessage } from './VoiceNoteMessage';
import { SystemEventMessage } from './SystemEventMessage';
import { ReactionBar } from './ReactionBar';
import { ConfirmDialog } from './ConfirmDialog';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function renderTextHtml(content: string): string {
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  const withLinks = escaped.replace(URL_REGEX, (url) => {
    const safe = DOMPurify.sanitize(url, { ALLOWED_TAGS: [] });
    return `<a href="${safe}" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2">${safe}</a>`;
  });
  return DOMPurify.sanitize(withLinks, {
    ALLOWED_TAGS: ['a'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

function StatusTicks({ message }: { message: MessengerMessage }) {
  if (!message.isMine) return null;
  const statusLabel =
    message.status === 'read'
      ? 'Seen'
      : message.status === 'delivered'
        ? 'Delivered'
        : 'Sent';
  return (
    <span
      className={clsx('shrink-0 text-[10px]', message.status === 'read' ? 'text-white/90' : 'text-white/60')}
      aria-label={statusLabel}
    >
      {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
    </span>
  );
}

interface MessageBubbleProps {
  message: MessengerMessage;
  currentUserId: string | null;
  showSender: boolean;
  showAvatar: boolean;
  onReact: (messageId: string, emoji: ReactionEmoji) => void;
  onReply: (message: MessengerMessage) => void;
  onEdit: (messageId: string, content: string) => void;
  onUnsend: (messageId: string) => void;
  onOpenImage?: (message: MessengerMessage) => void;
}

export function MessageBubble({
  message,
  currentUserId,
  showSender,
  showAvatar,
  onReact,
  onReply,
  onEdit,
  onUnsend,
  onOpenImage,
}: MessageBubbleProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content ?? '');
  const [showQuickReactions, setShowQuickReactions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [confirmUnsend, setConfirmUnsend] = useState(false);

  const copyMessage = useCallback(() => {
    const text = message.content ?? '';
    if (!text) return;
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [message.content]);

  if (message.type === 'system') {
    return <SystemEventMessage message={message} />;
  }

  const isMine = currentUserId !== null
    ? String(message.senderId) === String(currentUserId)
    : message.isMine;
  const canEdit =
    isMine && message.type === 'text' && !message.isDeleted &&
    Date.now() - new Date(message.createdAt).getTime() < 5 * 60 * 1000;
  const canDelete =
    isMine && !message.isDeleted &&
    Date.now() - new Date(message.createdAt).getTime() < 5 * 60 * 1000;

  const submitEdit = () => {
    const content = editValue.trim();
    if (content && content !== message.content) {
      onEdit(message._id, content);
    }
    setEditing(false);
  };

  const renderBubbleBody = () => {
    if (message.isDeleted) {
      return (
        <span className={clsx('italic', isMine ? 'text-white/70' : 'text-[var(--text-tertiary)]')}>
          {isMine ? 'You deleted this message' : 'This message was deleted'}
        </span>
      );
    }

    return (
      <div className="min-w-0 space-y-1">
        {message.replyToPreview && (
          <button
            type="button"
            onClick={() => onReply(message)}
            className="block max-w-full rounded-lg border border-white/12 bg-white/8 px-2.5 py-1.5 text-left text-xs text-slate-300 transition hover:bg-white/12"
          >
            <span className="font-semibold text-slate-200">{message.replyToPreview.senderName}</span>
            <span className="ml-1 text-slate-400">{(message.replyToPreview.contentPreview || '').slice(0, 60)}</span>
          </button>
        )}

        {message.type === 'image' && message.imageUrl && (
          <ImageMessage
            image={{
              url: message.imageUrl,
              thumbnailUrl: message.imageThumbnailUrl,
              width: message.imageWidth,
              height: message.imageHeight,
              alt: 'Shared image',
            }}
            onClick={onOpenImage ? () => onOpenImage(message) : undefined}
          />
        )}

        {message.type === 'gif' && message.gifUrl && (
          <GifMessage
            url={message.gifUrl}
            width={message.gifWidth}
            height={message.gifHeight}
            alt="GIF"
            onOpen={onOpenImage ? () => onOpenImage(message) : undefined}
          />
        )}

        {message.type === 'voice_note' && (
          <VoiceNoteMessage
            url={message.voiceNoteUrl}
            durationSeconds={message.voiceNoteDurationSeconds}
            waveform={message.voiceNoteWaveform}
          />
        )}

        {message.type === 'skill_card' && message.skillCardData && (
          <div className="rounded-xl border border-white/8 bg-[rgba(26,31,39,0.8)] p-3 text-xs backdrop-blur-sm">
            <p className="font-semibold text-[var(--text-primary)]">{message.skillCardData.skillName}</p>
            <p className="mt-1 text-slate-400">{message.skillCardData.teacherName}</p>
            <p className="mt-2 inline-block rounded-full bg-blue-500/15 border border-blue-400/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-300">
              {message.skillCardData.requestStatus}
            </p>
          </div>
        )}

        {message.content && message.type === 'text' && !editing && (
          <p
            className="whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: renderTextHtml(message.content) }}
          />
        )}

        {message.content && message.type !== 'text' && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {editing && (
          <div className="space-y-2">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitEdit();
                }
                if (e.key === 'Escape') setEditing(false);
              }}
              autoFocus
              maxLength={2000}
              rows={3}
              aria-label="Edit message"
              className="w-full resize-none rounded-md border border-[var(--border-default)] bg-transparent p-2 text-sm outline-none focus:border-[var(--accent)]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={submitEdit}
                className="rounded-md bg-[var(--accent)] px-2.5 py-1 text-xs font-medium text-white"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {message.editedAt && !editing && message.content && (
          <span className={clsx('block text-[10px]', isMine ? 'text-white/70' : 'text-[var(--text-tertiary)]')}>edited</span>
        )}
      </div>
    );
  };

  return (
    <div
      className={clsx('group relative flex gap-2 px-4 py-0.5', isMine ? 'justify-end' : 'justify-start')}
    >
      {!isMine && (
        <div className={clsx('w-8 shrink-0 self-end pb-5', showAvatar ? 'block' : 'invisible')}>
          {showAvatar && message.senderAvatar && message.senderAvatar.trim() ? (
            <img
              src={message.senderAvatar}
              alt={message.senderName}
              className="h-8 w-8 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              <FiUser className="h-4 w-4" />
            </span>
          )}
        </div>
      )}

      <div className={clsx('group flex min-w-0 max-w-[75%] flex-col', isMine ? 'items-end' : 'items-start')}>
        {showSender && !isMine && (
          <span className="mb-0.5 px-1 text-xs font-semibold text-[var(--text-secondary)]">
            {message.senderName}
          </span>
        )}

        <div
          onClick={() => setActionsVisible((prev) => !prev)}
          title={actionsVisible ? undefined : 'Click to show actions'}
          className={clsx(
            'relative max-w-full cursor-pointer rounded-[24px] px-4 py-2 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.08)]',
            isMine
              ? 'rounded-br-[8px] bg-gradient-to-br from-[var(--bubble-accent-from)] to-[var(--bubble-accent-to)] text-white'
              : 'rounded-bl-[8px] border border-white/8 bg-[rgba(26,31,39,0.96)] text-[var(--text-primary)]',
            message.isDeleted && 'opacity-60',
          )}
        >
          {renderBubbleBody()}

          <div className={clsx('mt-1 flex items-center gap-1', isMine ? 'justify-end' : 'justify-start')}>
            <span className={clsx('text-[9px] leading-none', isMine ? 'text-white/60' : 'text-slate-500')}>{formatMessageTime(message.createdAt)}</span>
            {isMine && <StatusTicks message={message} />}
          </div>
        </div>

        <ReactionBar
          reactions={message.reactions}
          currentUserId={currentUserId}
          isMine={isMine}
          onReact={(emoji) => onReact(message._id, emoji)}
        />

        <div
          className={clsx(
            'relative mt-0.5 flex items-center gap-1 opacity-60 transition group-hover:opacity-100 focus-within:opacity-100',
            (showQuickReactions || copied || actionsVisible) && 'opacity-100',
            isMine ? 'justify-end' : 'justify-start',
          )}
        >
          <button
            type="button"
            onClick={() => onReply(message)}
            aria-label="Reply"
            title="Reply"
            className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <FiCornerUpLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowQuickReactions((prev) => !prev)}
            aria-label="React"
            title="React"
            aria-expanded={showQuickReactions}
            className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <FiSmile className="h-3.5 w-3.5" />
          </button>
          {message.content && message.type === 'text' && !message.isDeleted && (
            <button
              type="button"
              onClick={copyMessage}
              aria-label={copied ? 'Copied' : 'Copy message'}
              title={copied ? 'Copied' : 'Copy'}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              {copied ? <FiCheck className="h-3.5 w-3.5 text-emerald-400" /> : <FiCopy className="h-3.5 w-3.5" />}
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setEditValue(message.content ?? '');
                setEditing(true);
              }}
              aria-label="Edit message"
              title="Edit"
              className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              <FiEdit2 className="h-3.5 w-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setConfirmUnsend(true)}
              aria-label="Delete message"
              title="Delete for everyone"
              className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:bg-[var(--danger)] hover:text-white"
            >
              <FiTrash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {showQuickReactions && (
            <div
              className={clsx(
                'absolute bottom-full mb-1 z-20 flex items-center gap-0.5 rounded-full border border-white/8 bg-[rgba(18,22,31,0.98)] px-2 py-1 shadow-[0_8px_16px_rgba(0,0,0,0.24)] backdrop-blur-lg',
                isMine ? 'right-0' : 'left-0',
              )}
            >
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact(message._id, emoji);
                    setShowQuickReactions(false);
                  }}
                  aria-label={`React with ${emoji}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-base transition hover:bg-white/12"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmUnsend}
        title="Delete message?"
        message="This message will be removed for everyone in this chat."
        confirmLabel="Delete"
        onConfirm={() => onUnsend(message._id)}
        onClose={() => setConfirmUnsend(false)}
      />
    </div>
  );
}
