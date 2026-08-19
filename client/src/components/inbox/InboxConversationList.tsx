import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import type { InboxConversation } from '../../types/inbox.types';

interface InboxConversationListProps {
  conversations: InboxConversation[];
  onTogglePin?: (connectionId: string) => void;
  onToggleMute?: (connectionId: string) => void;
}

function formatMessagePreview(message: InboxConversation['lastMessage']) {
  if (!message) return 'No messages yet';
  if (message.isDeleted) return 'Message deleted';
  if (!message.content) return 'No messages yet';
  return message.content.length > 60 ? `${message.content.slice(0, 60)}…` : message.content;
}

export default function InboxConversationList({ conversations, onTogglePin, onToggleMute }: InboxConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
        No conversations match this filter.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => {
        const other = conversation.otherUser;
        const skill = conversation.skill;
        const lastMessageAt = conversation.lastMessage?.createdAt
          ? new Date(conversation.lastMessage.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
          : 'No recent activity';

        return (
          <div
            key={conversation.connectionId}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-950 dark:hover:border-indigo-700"
          >
            <div className="flex items-start gap-3">
              <Link to={`/messages?conversationId=${encodeURIComponent(conversation.connectionId)}&type=skill`} className="shrink-0">
                <Avatar src={other.avatar} name={other.displayName || 'User'} size="sm" />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <Link to={`/messages?conversationId=${encodeURIComponent(conversation.connectionId)}&type=skill`} className="min-w-0 flex-1 text-sm font-semibold text-gray-900 hover:text-indigo-600 dark:text-gray-100 dark:hover:text-indigo-400">
                    <span className="truncate">{other.displayName || 'Unknown user'}</span>
                  </Link>
                  {conversation.unreadCount > 0 && (
                    <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {skill.name || 'Skill'}{skill.category ? ` · ${skill.category}` : ''}
                </p>

                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {formatMessagePreview(conversation.lastMessage)}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-gray-400 dark:text-gray-500">
                  <span>{lastMessageAt}</span>
                  <div className="flex items-center gap-2">
                    {conversation.isPinned && <span>📌</span>}
                    {conversation.isMuted && <span>🔕</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => onTogglePin?.(conversation.connectionId)}>
                {conversation.isPinned ? 'Unpin' : 'Pin'}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onToggleMute?.(conversation.connectionId)}>
                {conversation.isMuted ? 'Unmute' : 'Mute'}
              </Button>
              <Link to={`/messages?conversationId=${encodeURIComponent(conversation.connectionId)}&type=skill`} className="ml-auto">
                <Button size="sm">Open</Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
