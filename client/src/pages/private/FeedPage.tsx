import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getFeed } from '../../services/feed.service';
import type { FeedEvent, FeedListResult } from '../../types/feed.types';
import { getApiError } from '../../types/api.types';
import FeedCard from '../../components/social/FeedCard';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiHome } from 'react-icons/fi';

export default function FeedPage() {
  const [data, setData] = useState<FeedListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    getFeed(page)
      .then(setData)
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoading(false));
  }, [page]);

  function handleChanged(updated: FeedEvent) {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        events: prev.events.map((e) => (e._id === updated._id ? updated : e)),
      };
    });
  }

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiHome />}
        title="Hearth Feed"
        subtitle="See what your friends and community are up to."
      />

      {data && data.events.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiHome />}
          title="No activity yet"
          description="Add a skill, complete a session, or make a friend to light up the feed."
        />
      ) : (
        <div className="mt-6 space-y-4">
          {data?.events.map((event) => (
            <FeedCard key={event._id} event={event} onChanged={handleChanged} />
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Prev
          </Button>
          <span className="py-2 text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {data.totalPages}
          </span>
          <Button variant="secondary" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
