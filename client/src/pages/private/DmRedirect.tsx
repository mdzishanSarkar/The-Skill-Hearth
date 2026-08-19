import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useMessengerStore } from '../../stores/messengerStore';

export default function DmRedirect() {
  const { userId } = useParams<{ userId: string }>();
  const [ready, setReady] = useState(false);
  const conversations = useMessengerStore((state) => state.conversations);
  const fetchConversations = useMessengerStore((state) => state.fetchConversations);
  const openConversation = useMessengerStore((state) => state.openConversation);

  useEffect(() => {
    if (!userId) return;
    const friend = conversations.find(
      (c) =>
        c.conversationType === 'friend' &&
        c.participants.some((p) => p.userId === userId),
    );
    if (friend) {
      void openConversation(friend.conversationId, 'friend').finally(() => setReady(true));
      return;
    }
    void fetchConversations().finally(() => setReady(true));
  }, [userId, conversations, fetchConversations, openConversation]);

  if (!ready || !userId) return null;
  return <Navigate to="/messages" replace />;
}