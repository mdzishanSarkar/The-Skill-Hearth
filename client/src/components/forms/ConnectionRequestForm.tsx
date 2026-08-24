import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { sendConnectionRequest } from '../../services/connections';
import { listRequestTemplates } from '../../services/requestTemplate.service';
import { getApiError } from '../../types/api.types';
import type { Connection } from '../../types/connection.types';
import type { RequestTemplate } from '../../types/requestTemplate.types';
import Button from '../ui/Button';

interface ConnectionRequestFormProps {
  teacherId: string;
  skillId: string;
  skillName: string;
  categoryId?: string;
  onSuccess?: (connection: Connection) => void;
  onCancel?: () => void;
}

export default function ConnectionRequestForm({
  teacherId,
  skillId,
  skillName,
  categoryId,
  onSuccess,
  onCancel,
}: ConnectionRequestFormProps) {
  const [message, setMessage] = useState('');
  const [proposedFormat, setProposedFormat] = useState<'in-person' | 'online' | 'either'>('either');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<RequestTemplate[]>([]);

  useEffect(() => {
    if (!categoryId) return;
    let cancelled = false;
    listRequestTemplates({ categoryId })
      .then((result) => {
        if (!cancelled) setTemplates(result.templates);
      })
      .catch(() => {
        if (!cancelled) setTemplates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  function applyTemplate(template: RequestTemplate) {
    setMessage(`${template.intro}\n\n${template.body}`.trim());
  }

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
      const connection = await sendConnectionRequest({ teacherId, skillId, message: trimmed, proposedFormat });
      toast.success('Request sent!');
      onSuccess?.(connection);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        Request: <span className="text-indigo-600 dark:text-indigo-400">{skillName}</span>
      </h3>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Introduce yourself</label>
        {templates.length > 0 && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Start from a template:</p>
            <div className="flex flex-wrap gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  title={template.intro}
                  className="rounded-full border border-gray-300 dark:border-gray-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
                >
                  {template.title}
                </button>
              ))}
            </div>
          </div>
        )}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 500))}
          rows={4}
          maxLength={500}
          placeholder="Hi! I'd love to learn this skill. I'm a beginner and hoping to..."
          className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{message.length}/500</p>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preferred format</label>
        <div className="mt-2 flex gap-2">
          {(['in-person', 'online', 'either'] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setProposedFormat(fmt)}
              className={
                proposedFormat === fmt
                  ? 'flex-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white'
                  : 'flex-1 rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            >
              {fmt === 'in-person' ? 'In person' : fmt === 'online' ? 'Online' : 'Either'}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

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
