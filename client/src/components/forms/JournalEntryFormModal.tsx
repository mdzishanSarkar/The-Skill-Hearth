import { useEffect, useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { getActiveChats } from '../../services/connections';
import { createEntry, updateEntry } from '../../services/journal.service';
import { getApiError } from '../../types/api.types';
import type { Connection } from '../../types/connection.types';
import type { JournalEntry } from '../../types/journal.types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const MOOD_OPTIONS = [
  { value: 1, label: 'Rough', emoji: '😞' },
  { value: 2, label: 'Meh', emoji: '😕' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Great', emoji: '🤩' },
] as const;

const MAX_CONTENT = 2000;

interface JournalEntryFormModalProps {
  open: boolean;
  onClose: () => void;
  fixedConnectionId?: string;
  fixedConnectionTitle?: string;
  mode?: 'create' | 'edit';
  initial?: JournalEntry | null;
  onSubmitted: () => void;
}

export default function JournalEntryFormModal({
  open,
  onClose,
  fixedConnectionId,
  fixedConnectionTitle,
  mode = 'create',
  initial,
  onSubmitted,
}: JournalEntryFormModalProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionId, setConnectionId] = useState(fixedConnectionId ?? '');
  const [prompt, setPrompt] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<number>(3);
  const [highlighted, setHighlighted] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setConnectionId(fixedConnectionId ?? '');
    setPrompt(initial?.prompt ?? '');
    setContent(initial?.content ?? '');
    setMood(initial?.mood ?? 3);
    setHighlighted(initial?.isHighlighted ?? false);
    setError('');
    setSubmitting(false);

    if (!fixedConnectionId) {
      setLoadingConnections(true);
      getActiveChats()
        .then((chats) => setConnections(chats))
        .catch(() => setConnections([]))
        .finally(() => setLoadingConnections(false));
    }
  }, [open, fixedConnectionId, initial]);

  const selectedConnection = connections.find((c) => c._id === connectionId);

  async function handleSubmit() {
    if (submitting) return;
    if (!connectionId) {
      setError('Please choose a connection to journal about.');
      return;
    }
    if (!content.trim()) {
      setError('Write a little something before saving.');
      return;
    }
    setSubmitting(true);
    setError('');
    const payload = {
      connectionId,
      prompt: prompt.trim(),
      content: content.trim(),
      mood,
      isHighlighted: highlighted,
    };
    try {
      if (mode === 'edit' && initial) {
        await updateEntry(initial.id, payload);
        toast.success('Entry updated');
      } else {
        await createEntry(payload);
        toast.success('Entry added — logging streak updated');
      }
      onSubmitted();
      onClose();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit journal entry' : 'New journal entry'}
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Reflect on a session to track your progress and grow your logging streak.
        </p>

        {!fixedConnectionId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Connection <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <select
              value={connectionId}
              onChange={(e) => setConnectionId(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">{loadingConnections ? 'Loading…' : 'Select a connection…'}</option>
              {connections.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.skillId?.skillName ?? 'Skill'} · {c.teacherId?.displayName ?? 'Teacher'}
                </option>
              ))}
            </select>
          </div>
        )}

        {(fixedConnectionTitle || selectedConnection) && (
          <p className="text-sm text-indigo-600 dark:text-indigo-400">
            {fixedConnectionTitle ?? `${selectedConnection!.skillId?.skillName ?? 'Skill'} with ${selectedConnection!.teacherId?.displayName ?? 'your teacher'}`}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prompt</label>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 300))}
            placeholder="What did you focus on this session?"
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reflection</label>
            <span className="text-xs text-gray-400 dark:text-gray-500">{content.length}/{MAX_CONTENT}</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
            rows={5}
            placeholder="What did you learn or teach today? What will you do differently next time?"
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">How did it feel?</p>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMood(option.value)}
                title={option.label}
                className={clsx(
                  'min-w-14 flex-1 rounded-md border px-2 py-1.5 text-center transition-colors',
                  mood === option.value
                    ? 'border-indigo-600 bg-indigo-600'
                    : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <span className="block text-base leading-none">{option.emoji}</span>
                <span
                  className={clsx(
                    'mt-1 block text-[10px]',
                    mood === option.value ? 'text-indigo-50' : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={highlighted}
            onChange={(e) => setHighlighted(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Highlight this entry (mark it as a favorite)
        </label>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {mode === 'edit' ? 'Save changes' : 'Save entry'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
