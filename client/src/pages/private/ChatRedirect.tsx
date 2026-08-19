import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useMessengerStore } from '../../stores/messengerStore';

export default function ChatRedirect() {
  const { id } = useParams<{ id: string }>();
  const [ready, setReady] = useState(false);
  const openConversation = useMessengerStore((state) => state.openConversation);

  useEffect(() => {
    if (!id) return;
    void openConversation(id, 'skill').finally(() => setReady(true));
  }, [id, openConversation]);

  if (!ready || !id) return null;
  return <Navigate to="/messages" replace />;
}