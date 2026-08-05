import { useState } from 'react';
import toast from 'react-hot-toast';
import { sendConnectionRequest } from '../../services/connections';
import { getApiError } from '../../types/api.types';
import Button from '../ui/Button';

interface ConnectionRequestFormProps {
  teacherId: string;
  skillId: string;
  skillName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ConnectionRequestForm({
  teacherId,
  skillId,
  skillName,
  onSuccess,
  onCancel,
}: ConnectionRequestFormProps) {
  const [message, setMessage] = useState('');
  const [proposedFormat, setProposedFormat] = useState<'in-person' | 'online' | 'either'>('either');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError('Please introduce yourself and what you hope to learn.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendConnectionRequest({ teacherId, skillId, message: trimmed, proposedFormat });
      toast.success('Request sent!');
      onSuccess?.();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">
        Request: <span className="text-indigo-600">{skillName}</span>
      </h3>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Introduce yourself</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 500))}
          rows={4}
          maxLength={500}
          placeholder="Hi! I'd love to learn this skill. I'm a beginner and hoping to..."
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-400">{message.length}/500</p>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Preferred format</label>
        <div className="mt-2 flex gap-2">
          {(['in-person', 'online', 'either'] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setProposedFormat(fmt)}
              className={
                proposedFormat === fmt
                  ? 'flex-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white'
                  : 'flex-1 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200'
              }
            >
              {fmt === 'in-person' ? 'In person' : fmt === 'online' ? 'Online' : 'Either'}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex gap-3">
        <Button type="submit" loading={loading} className="flex-1">
          Send request
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
