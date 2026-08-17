import { useCallback, useEffect, useState } from 'react';
import { getInboxConversations } from '../services/inbox';
import type { InboxConversation, InboxFilter } from '../types/inbox.types';

export function useInboxConversations(initialPage = 1, initialFilter: InboxFilter = 'all') {
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [page, setPage] = useState(initialPage);
  const [filter, setFilter] = useState<InboxFilter>(initialFilter);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getInboxConversations(page, 20, filter);
      setConversations(result.conversations);
      setTotalPages(result.meta.totalPages || 1);
      setTotalUnread(result.totalUnread || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load conversations';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    conversations,
    page,
    setPage,
    filter,
    setFilter,
    totalPages,
    totalUnread,
    isLoading,
    error,
    refresh,
  };
}
