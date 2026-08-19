import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getFeed } from '../../services/feed.service';
import type { FeedEvent, FeedListResult } from '../../types/feed.types';
import { getApiError } from '../../types/api.types';
import FeedCard from '../../components/social/FeedCard';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiHome, FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function FeedPage() {
  const [data, setData] = useState<FeedListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFeed(page)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) toast.error(getApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await getFeed(1);
      setPage(1);
      setData(res);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const goToPage = useCallback(
    (next: number) => {
      if (!data || next < 1 || next > data.totalPages || next === page) return;
      setPage(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [data, page],
  );

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
        onIconClick={handleRefresh}
        title="Hearth Feed"
        subtitle="See what your friends and community are up to."
        actions={
          <Button variant="secondary" size="sm" onClick={handleRefresh} loading={refreshing}>
            <FiRefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {data && data.events.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiHome />}
          title="No activity yet"
          description="Add a skill, complete a session, or make a friend to light up the feed."
        />
      ) : (
        <>
          {data && data.total > 0 && (
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {data.total} update{data.total === 1 ? '' : 's'} · Page {page}
            </p>
          )}

          {loading && data && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-xs font-medium text-indigo-600 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300">
              <Spinner size="sm" />
              Loading page {page}…
            </div>
          )}

          <div className="mt-4 space-y-4">
            {data?.events.map((event) => (
              <FeedCard key={event._id} event={event} onChanged={handleChanged} />
            ))}
          </div>
        </>
      )}

      {data && data.totalPages > 1 && (
        <nav aria-label="Feed pagination" className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            <FiChevronLeft className="mr-1 h-4 w-4" /> Prev
          </Button>
          <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">
            Page <span className="font-semibold text-gray-900 dark:text-gray-100">{page}</span> of {data.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next <FiChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </nav>
      )}
    </div>
  );

  function handleChanged(updated: FeedEvent) {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        events: prev.events.map((e) => (e._id === updated._id ? updated : e)),
      };
    });
  }
}