import { useState, useRef } from 'react';
import { FiSmile, FiPaperclip, FiSend } from 'react-icons/fi';
import Button from '../ui/Button';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const submittingRef = useRef(false);

  function handleSubmit(e?: React.FormEvent | React.KeyboardEvent<HTMLTextAreaElement>) {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled || submittingRef.current) return;

    submittingRef.current = true;
    onSend(trimmed);
    setValue('');
    inputRef.current?.focus();

    requestAnimationFrame(() => {
      submittingRef.current = false;
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white/90 p-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/80">
      <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-2 shadow-inner dark:border-slate-700 dark:bg-slate-900">
        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200" aria-label="Emoji">
          <FiSmile className="h-4 w-4" />
        </button>

        <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200" aria-label="Attach file">
          <FiPaperclip className="h-4 w-4" />
        </button>

        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, 1000))}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Type a message..."
          disabled={disabled}
          className="max-h-32 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed dark:text-slate-100 dark:placeholder:text-slate-500"
          style={{ maxHeight: '120px' }}
        />

        <Button type="submit" size="sm" disabled={!value.trim() || disabled} className="h-11 w-11 rounded-full p-0">
          <FiSend className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
