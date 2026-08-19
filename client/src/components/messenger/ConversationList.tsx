import type { ConversationSummary } from '../../types/messenger.types';
import { ConversationItem } from './ConversationItem';

interface ConversationListProps {
  conversations: ConversationSummary[];
  currentUserId: string | null;
  activeConversationId: string | null;
  onOpen: (conversation: ConversationSummary) => void;
  onDeleteChat?: (conversation: ConversationSummary) => void;
}

export function ConversationList({ conversations, currentUserId, activeConversationId, onOpen, onDeleteChat }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <span className="text-3xl">🔥</span>
        <p className="text-sm font-medium text-slate-200">No conversations yet.</p>
        <p className="text-xs text-slate-500">Accept a skill connection or start chatting with a friend.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-white/8">
      {conversations.map((conversation) => (
        <li key={`${conversation.conversationType}:${conversation.conversationId}`}>
          <ConversationItem
            conversation={conversation}
            currentUserId={currentUserId}
            isActive={activeConversationId === conversation.conversationId}
            onOpen={() => onOpen(conversation)}
            onDeleteChat={onDeleteChat ? () => onDeleteChat(conversation) : undefined}
          />
        </li>
      ))}
    </ul>
  );
}