import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMessengerStore } from '../../stores/messengerStore';
import { MessengerPanel } from '../../components/messenger/MessengerPanel';
import { useAvailableViewportHeight } from '../../hooks/useAvailableViewportHeight';

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const initialConversationOpened = useRef(false);
  const { ref: viewportRef, height } = useAvailableViewportHeight<HTMLDivElement>();
  const targetConversationId = searchParams.get('conversationId');
  const targetType = searchParams.get('type');
  const conversations = useMessengerStore((state) => state.conversations);
  const openWindows = useMessengerStore((state) => state.openWindows);
  const activeConversationId = useMessengerStore((state) => state.activeConversationId);
  const fetchConversations = useMessengerStore((state) => state.fetchConversations);
  const openConversation = useMessengerStore((state) => state.openConversation);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!targetConversationId || !targetType || (targetType !== 'skill' && targetType !== 'friend')) return;
    const isAlreadyOpen = openWindows.some(
      (w) => w.conversationId === targetConversationId && w.conversationType === targetType,
    );
    if (!isAlreadyOpen) {
      void openConversation(targetConversationId, targetType);
    }
  }, [targetConversationId, targetType, openWindows, openConversation]);

  useEffect(() => {
    if (conversations.length === 0) return;
    if (initialConversationOpened.current) return;
    if (!targetConversationId && openWindows.length === 0 && !activeConversationId) {
      const first = conversations[0];
      initialConversationOpened.current = true;
      void openConversation(first.conversationId, first.conversationType);
    }
  }, [conversations, openWindows.length, activeConversationId, openConversation, targetConversationId]);

  return (
    <div ref={viewportRef} style={{ height }} className="min-h-0 overflow-hidden px-3 py-3 md:px-4">
      <MessengerPanel />
    </div>
  );
}