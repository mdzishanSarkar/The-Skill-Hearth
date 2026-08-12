import { useState } from 'react';
import toast from 'react-hot-toast';
import { submitReport } from '../../services/reports';
import { REPORT_REASONS, type ReportTargetType, type ReportReason } from '../../types/report.types';
import { getApiError } from '../../types/api.types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface ReportFormProps {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetName?: string;
}

export default function ReportForm({ open, onClose, targetType, targetId, targetName }: ReportFormProps) {
  const [reason, setReason] = useState<ReportReason>('other');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reasons = REPORT_REASONS[targetType];

  function handleClose() {
    setReason('other');
    setDescription('');
    setError('');
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await submitReport({
        targetType,
        targetId,
        reason,
        description: description.trim() || undefined,
      });
      toast.success('Report submitted. Thank you for helping keep our community safe.');
      handleClose();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Report ${targetType}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {targetName && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Reporting: <span className="font-medium text-gray-900 dark:text-gray-100">{targetName}</span>
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {reasons.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Additional details <span className="text-gray-400 dark:text-gray-500">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            rows={3}
            maxLength={500}
            placeholder="Provide any additional context..."
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{description.length}/500</p>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Submit report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
