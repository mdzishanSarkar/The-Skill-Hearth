import { useEffect, useMemo, useRef, useState } from 'react';
import { FiSend, FiSmile, FiImage, FiFilm, FiX, FiCornerUpLeft } from 'react-icons/fi';
import type { ConversationType } from '../../types/messenger.types';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  conversationId: string;
  conversationType: ConversationType;
  draft: string;
  replyPreview: { senderName: string; contentPreview: string } | null;
  onDraftChange: (content: string) => void;
  onSendText: (content: string) => void;
  onSendImage: (file: File, caption?: string) => void;
  onSendGif: (url: string) => void;
  onDismissReply: () => void;
  onTyping: (isTyping: boolean) => void;
}

const MAX_LENGTH = 2000;

export function MessageInput({
  draft,
  replyPreview,
  onDraftChange,
  onSendText,
  onSendImage,
  onSendGif,
  onDismissReply,
  onTyping,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [gifUrl, setGifUrl] = useState('');
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingCaption, setPendingCaption] = useState('');

  const pendingImageUrl = useMemo(
    () => (pendingImage ? URL.createObjectURL(pendingImage) : null),
    [pendingImage],
  );

  useEffect(() => {
    if (!pendingImageUrl) return;
    return () => URL.revokeObjectURL(pendingImageUrl);
  }, [pendingImageUrl]);

  const gifPreviewSrc = (() => {
    const url = gifUrl.trim();
    if (!url) return null;
    if (url.startsWith('data:image/')) return url;
    return /^https?:\/\//i.test(url) ? url : null;
  })();

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [draft]);

  const emitTyping = (isTyping: boolean) => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (isTyping) {
      onTyping(true);
      typingTimerRef.current = setTimeout(() => onTyping(false), 3000);
    } else {
      onTyping(false);
    }
  };

  const handleSend = () => {
    const content = draft.trim();
    if (!content) return;
    onSendText(content);
    onTyping(false);
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    onDraftChange(next.slice(0, MAX_LENGTH));
    requestAnimationFrame(() => {
      if (el) {
        const pos = start + emoji.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  };

  const confirmImage = () => {
    if (!pendingImage) return;
    onSendImage(pendingImage, pendingCaption.trim() || undefined);
    setPendingImage(null);
    setPendingCaption('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmGif = () => {
    const url = gifUrl.trim();
    if (!url) return;
    onSendGif(url);
    setGifUrl('');
    setGifOpen(false);
  };

  return (
    <div className="messenger-composer border-t border-white/8 px-3 py-2.5 backdrop-blur-xl">
      {replyPreview && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-blue-400/20 bg-[rgba(59,130,246,0.08)] px-3 py-1.5 text-xs text-slate-200 backdrop-blur-sm">
          <FiCornerUpLeft className="shrink-0 text-blue-400/60" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-blue-300">{replyPreview.senderName}</span>
            <span className="ml-1 truncate text-slate-400">{replyPreview.contentPreview}</span>
          </div>
          <button
            type="button"
            onClick={onDismissReply}
            aria-label="Cancel reply"
            className="shrink-0 text-slate-500 hover:text-slate-300 transition"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
      )}

      {pendingImage && (
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-[var(--surface-raised)] p-2">
          {pendingImageUrl && (
            <img
              src={pendingImageUrl}
              alt="Image preview"
              className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
            />
          )}
          <div className="min-w-0 flex-1">
            <span className="block truncate text-xs text-[var(--text-secondary)]">{pendingImage.name}</span>
            <input
              value={pendingCaption}
              onChange={(e) => setPendingCaption(e.target.value)}
              placeholder="Add a caption…"
              aria-label="Image caption"
              className="mt-1 w-full rounded-md border border-[var(--border-default)] bg-transparent px-2 py-1 text-xs outline-none focus:border-[var(--accent)]"
            />
          </div>
          <button
            type="button"
            onClick={confirmImage}
            className="shrink-0 rounded-md bg-[var(--accent)] px-2.5 py-1 text-xs font-medium text-white"
          >
            Send
          </button>
          <button
            type="button"
            onClick={() => setPendingImage(null)}
            aria-label="Cancel image"
            className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
      )}

      {gifOpen && (
        <div className="mb-2 space-y-2 rounded-lg bg-[var(--surface-raised)] p-2">
          <p className="text-xs text-[var(--text-tertiary)]">Paste a GIF URL to share.</p>
          <div className="flex gap-2">
            <input
              value={gifUrl}
              onChange={(e) => setGifUrl(e.target.value)}
              placeholder="https://…"
              aria-label="GIF URL"
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmGif();
              }}
              className="min-w-0 flex-1 rounded-md border border-[var(--border-default)] bg-transparent px-2 py-1.5 text-xs outline-none focus:border-[var(--accent)]"
            />
            <button
              type="button"
              onClick={confirmGif}
              className="shrink-0 rounded-md bg-[var(--accent)] px-2.5 py-1 text-xs font-medium text-white"
            >
              Send
            </button>
            <button
              type="button"
              onClick={() => setGifOpen(false)}
              aria-label="Close GIF picker"
              className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
          {gifPreviewSrc && (
            <div className="relative overflow-hidden rounded-lg border border-[var(--border-default)]">
              <img
                src={gifPreviewSrc}
                alt="GIF preview"
                className="max-h-44 w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.visibility = 'hidden';
                }}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex items-end gap-1.5">
        <button
          type="button"
          onClick={() => {
            setEmojiOpen((prev) => !prev);
            setGifOpen(false);
          }}
          aria-label="Emoji"
          aria-expanded={emojiOpen}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
            emojiOpen ? 'bg-[#1d4ed8]/20 text-[#7dd3fc]' : 'text-slate-300 hover:bg-white/8 hover:text-white'
          }`}
        >
          <FiSmile className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Send image"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:bg-[var(--bg-hover)]"
        >
          <FiImage className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setGifOpen((prev) => !prev);
            setEmojiOpen(false);
          }}
          aria-label="Send GIF"
          aria-expanded={gifOpen}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
            gifOpen ? 'bg-[#1d4ed8]/20 text-[#7dd3fc]' : 'text-slate-300 hover:bg-white/8 hover:text-white'
          }`}
        >
          <FiFilm className="h-5 w-5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setPendingImage(file);
          }}
        />

        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            onDraftChange(e.target.value.slice(0, MAX_LENGTH));
            emitTyping(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          onBlur={() => emitTyping(false)}
          placeholder="Message…"
          aria-label="Message"
          maxLength={MAX_LENGTH}
          rows={1}
          className="max-h-[140px] min-h-9 flex-1 resize-none rounded-2xl border border-white/8 bg-[rgba(255,255,255,0.04)] px-3.5 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400/40 focus:ring-2 focus:ring-blue-400/10 transition"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!draft.trim()}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--bubble-accent-from),var(--bubble-accent-to))] text-white shadow-[0_8px_16px_color-mix(in_srgb,var(--bubble-accent-to)_32%,transparent)] transition hover:scale-105 hover:shadow-[0_12px_24px_color-mix(in_srgb,var(--bubble-accent-to)_42%,transparent)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          <FiSend className="h-4 w-4" />
        </button>
      </div>

      {draft.length >= MAX_LENGTH - 100 && (
        <div className="mt-1 flex justify-end pr-1">
          <span
            className={
              draft.length >= MAX_LENGTH
                ? 'text-[10px] font-medium text-rose-400'
                : 'text-[10px] text-slate-500'
            }
            aria-live="polite"
          >
            {draft.length}/{MAX_LENGTH}
          </span>
        </div>
      )}

      {emojiOpen && (
        <div className="mt-2">
          <EmojiPicker onSelect={insertEmoji} onClose={() => setEmojiOpen(false)} />
        </div>
      )}
    </div>
  );
}
