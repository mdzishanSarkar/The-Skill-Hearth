import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listEntries } from '../../services/journal.service';
import type { JournalEntry } from '../../types/journal.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import {
  FiBookOpen,
  FiRefreshCw,
  FiStar,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import JournalEntryFormModal from '../../components/forms/JournalEntryFormModal';
import { moodEmoji, formatDate } from '../../utils/journal';

const PAGE_SIZE = 10;

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [version, setVersion] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listEntries({ page, limit: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setEntries(data.entries);
        setTotal(data.total);
        setTotalPages(data.pages);
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
  }, [page, version]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await listEntries({ page: 1, limit: PAGE_SIZE });
      setPage(1);
      setEntries(data.entries);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const goToPage = useCallback(
    (next: number) => {
      if (next < 1 || next > totalPages || next === page) return;
      setPage(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [page, totalPages],
  );

  const highlighted = entries.filter((e) => e.isHighlighted).length;

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiBookOpen />}
        onIconClick={refresh}
        title="Skill Journal"
        subtitle="Reflect on your sessions, keep your logging streak alive, and watch yourself grow."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={refresh} loading={refreshing}>
              <FiRefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setShowCreate(true)}>New entry</Button>
          </>
        }
      />

      <div className="mt-6 grid max-w-md grid-cols-2 gap-4">
        <StatCard icon={<FiBookOpen />} label="Total entries" value={total} tone="indigo" />
        <StatCard icon={<FiStar />} label="Highlighted" value={highlighted} hint="on this page" tone="amber" />
      </div>

      {loading && entries.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiBookOpen />}
          title="No journal entries yet"
          description="Complete a session, then write your first reflection to start your logging streak."
          action={<Button onClick={() => setShowCreate(true)}>Write your first entry</Button>}
        />
      ) : (
        <>
          {loading && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-xs font-medium text-indigo-600 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300">
              <Spinner size="sm" />
              Loading page {page}…
            </div>
          )}
          <div className="mt-6 space-y-4">
            {entries.map((entry) => (
              <Link
                key={entry.id}
                to={`/journal/${entry.id}`}
                className="card card-hover block p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {entry.skill && (
                      <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        {entry.skill.emoji ?? '📓'} {entry.skill.name}
                      </p>
                    )}
                    <p className="mt-1 text-sm italic text-gray-500 dark:text-gray-400">“{entry.prompt}”</p>
                    <p className="mt-2 line-clamp-3 text-sm text-gray-800 dark:text-gray-200">{entry.content}</p>
                  </div>
                  <span className="shrink-0 text-xl" title={moodEmoji(entry.mood)?.label}>
                    {moodEmoji(entry.mood)?.emoji}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(entry.createdAt)}</span>
                  {entry.isHighlighted && (
                    <span className="rounded-full bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                      ★ Highlighted
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <nav aria-label="Journal pagination" className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            <FiChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400">
            Page <span className="font-semibold text-gray-900 dark:text-gray-100">{page}</span> of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next <FiChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </nav>
      )}

      <JournalEntryFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmitted={() => {
          setPage(1);
          setVersion((v) => v + 1);
        }}
      />
    </div>
  );
}