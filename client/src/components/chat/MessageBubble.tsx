import type { ChatMessage } from '../../types/message.types';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showSender?: boolean;
}

export default function MessageBubble({ message, isOwn, showSender }: MessageBubbleProps) {
  return (
    <div className={`mb-3 flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2 shadow-sm ring-1 ${
          isOwn
            ? 'rounded-br-md bg-gradient-to-br from-emerald-500 to-teal-500 text-white ring-emerald-400/40'
            : 'rounded-bl-md bg-slate-100 text-slate-800 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700'
        }`}
      >
        {showSender && !isOwn && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-500 dark:text-violet-400">
            {message.senderName || 'Unknown'}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
        <div className={`mt-1.5 flex items-center gap-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] ${isOwn ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'}`}>
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
          {isOwn && (
            <span className={`text-[10px] ${message.readAt ? 'text-emerald-100' : 'text-emerald-200'}`}>
              {message.readAt ? '✓✓' : message.deliveredAt ? '✓' : '•'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
