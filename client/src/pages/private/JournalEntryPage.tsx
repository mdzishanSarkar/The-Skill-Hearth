import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { deleteEntry, getEntry } from '../../services/journal.service';
import type { JournalEntry } from '../../types/journal.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import JournalEntryFormModal from '../../components/forms/JournalEntryFormModal';
import { moodEmoji, formatDate } from '../../utils/journal';

export default function JournalEntryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setEntry(await getEntry(id));
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete() {
    if (!id) return;
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      await deleteEntry(id);
      toast.success('Entry deleted');
      navigate('/journal');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">Entry not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/journal')}>
          Back to journal
        </Button>
      </div>
    );
  }

  const mood = moodEmoji(entry.mood);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button variant="secondary" size="sm" onClick={() => navigate('/journal')}>
        ← Back to journal
      </Button>

      <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {entry.skill && (
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                {entry.skill.emoji ?? '📓'} {entry.skill.name}
              </p>
            )}
            <p className="mt-2 text-lg font-semibold italic text-gray-900 dark:text-gray-100">
              “{entry.prompt}”
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-center">
            <span className="text-3xl" title={mood?.label}>
              {mood?.emoji}
            </span>
            {mood && <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">{mood.label}</span>}
          </div>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200">
          {entry.content}
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(entry.createdAt)}</span>
          {entry.isHighlighted && (
            <span className="rounded-full bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
              ★ Highlighted
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setShowEdit(true)}>
            Edit
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)} loading={deleting}>
            Delete
          </Button>
        </div>
      </div>

      <JournalEntryFormModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        mode="edit"
        initial={entry}
        fixedConnectionId={entry.connectionId}
        onSubmitted={load}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete this journal entry?"
        message="This cannot be undone. Your reflection will be permanently removed."
        confirmLabel="Delete entry"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
