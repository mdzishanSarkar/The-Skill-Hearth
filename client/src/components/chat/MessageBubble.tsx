import type { ChatMessage } from '../../types/message.types';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showSender?: boolean;
}

export default function MessageBubble({ message, isOwn, showSender }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isOwn
            ? 'bg-indigo-600 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        }`}
      >
        {showSender && !isOwn && (
          <p className="mb-1 text-xs font-semibold text-indigo-600">
            {message.senderName || 'Unknown'}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <div className={`mt-1 flex items-center gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] ${isOwn ? 'text-indigo-200' : 'text-gray-400'}`}>
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
          {isOwn && (
            <span className={`text-[10px] ${message.readAt ? 'text-indigo-200' : 'text-indigo-300'}`}>
              {message.readAt ? '✓✓' : message.deliveredAt ? '✓' : '•'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
