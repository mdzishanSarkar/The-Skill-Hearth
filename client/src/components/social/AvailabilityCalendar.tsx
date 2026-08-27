import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getBlockOutDates, addBlockOutDate, removeBlockOutDate } from '../../services/blockOutDate.service';
import type { BlockOutDate } from '../../types/social.types';
import { getApiError } from '../../types/api.types';
import Button from '../ui/Button';

export default function AvailabilityCalendar() {
  const [blockOutDates, setBlockOutDates] = useState<BlockOutDate[]>([]);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadDates();
  }, []);

  async function loadDates() {
    try {
      const data = await getBlockOutDates();
      setBlockOutDates(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!date) {
      toast.error('Please select a date');
      return;
    }
    setAdding(true);
    try {
      const result = await addBlockOutDate(date, reason);
      setBlockOutDates((prev) => [...prev, result].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setDate('');
      setReason('');
      toast.success('Date blocked out');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeBlockOutDate(id);
      setBlockOutDates((prev) => prev.filter((d) => d._id !== id));
      toast.success('Date removed');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Block-out Dates</h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Mark dates when you're unavailable for sessions.
      </p>

      <form onSubmit={handleAdd} className="mt-4 flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={today}
          className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
        />
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 200))}
          placeholder="Reason (optional)"
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
        />
        <Button type="submit" size="sm" loading={adding}>
          Add
        </Button>
      </form>

      {loading ? (
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">Loading...</p>
      ) : blockOutDates.length === 0 ? (
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">No block-out dates.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {blockOutDates.map((d) => (
            <li key={d._id} className="flex items-center justify-between rounded-md bg-gray-50 dark:bg-gray-900 px-3 py-2">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                {d.reason && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({d.reason})</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(d._id)}
                className="text-xs text-red-500 dark:text-red-400 hover:text-red-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
