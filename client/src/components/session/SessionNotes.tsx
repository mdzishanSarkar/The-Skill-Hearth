import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getSessionNote, updateSessionNote } from '../../services/session.service';
import { getApiError } from '../../types/api.types';
import Button from '../ui/Button';

interface SessionNotesProps {
  connectionId: string;
}

export default function SessionNotes({ connectionId }: SessionNotesProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSessionNote(connectionId)
      .then((note) => setContent(note.content || ''))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [connectionId]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await updateSessionNote(connectionId, content);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-xs text-gray-400 dark:text-gray-500">Loading notes...</p>;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Session Notes</h4>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Private notes for your session preparation.</p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, 2000))}
        rows={4}
        maxLength={2000}
        className="mt-3 w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        placeholder="Add notes about this session..."
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500">{content.length}/2000</span>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-600 dark:text-green-400">Saved!</span>}
          <Button size="sm" loading={saving} onClick={handleSave}>
            Save notes
          </Button>
        </div>
      </div>
    </div>
  );
}
