import { useEffect, useState } from 'react';
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
import { FiBookOpen, FiStar } from 'react-icons/fi';
import JournalEntryFormModal from '../../components/forms/JournalEntryFormModal';
import { moodEmoji, formatDate } from '../../utils/journal';

const PAGE_SIZE = 10;

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await listEntries({ page, limit: PAGE_SIZE });
      setEntries(data.entries);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const highlighted = entries.filter((e) => e.isHighlighted).length;

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiBookOpen />}
        title="Skill Journal"
        subtitle="Reflect on your sessions, keep your logging streak alive, and watch yourself grow."
        actions={<Button onClick={() => setShowCreate(true)}>New entry</Button>}
      />

      <div className="mt-6 grid max-w-md grid-cols-2 gap-4">
        <StatCard icon={<FiBookOpen />} label="Total entries" value={total} tone="indigo" />
        <StatCard icon={<FiStar />} label="Highlighted" value={highlighted} tone="amber" />
      </div>

      {loading ? (
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
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <JournalEntryFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmitted={() => {
          setPage(1);
          void load();
        }}
      />
    </div>
  );
}
