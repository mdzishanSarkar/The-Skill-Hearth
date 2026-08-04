import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import type { ReportReason, ReportTargetType } from '../../types/report.types';
import { REPORT_REASON_LABELS, REPORT_REASONS } from '../../types/report.types';
import { getApiError } from '../../types/api.types';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetName: string;
  onSubmit: (reason: ReportReason, description?: string) => Promise<unknown>;
}

const MAX_DESCRIPTION = 300;

export default function ReportModal({
  open,
  onClose,
  targetType,
  targetName,
  onSubmit,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setReason(null);
    setDescription('');
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!reason) {
      toast.error('Please choose a reason');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(reason, description.trim() || undefined);
      toast.success('Report submitted for review');
      reset();
      onClose();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={`Report ${targetName}`}>
      <p className="text-sm text-gray-600">
        Reports are sent to our moderation team for review. Please keep your report honest and
        factual.
      </p>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-gray-900">Reason</legend>
        <div className="mt-2 flex flex-col gap-2">
          {REPORT_REASONS[targetType].map((item) => (
            <label
              key={item}
              className="flex cursor-pointer items-center gap-2.5 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
            >
              <input
                type="radio"
                name={`report-reason-${targetType}`}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                checked={reason === item}
                onChange={() => setReason(item)}
              />
              {REPORT_REASON_LABELS[item]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        <label htmlFor="report-description" className="block text-sm font-medium text-gray-900">
          Details <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="report-description"
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION))}
          rows={3}
          placeholder="Add context for the moderation team…"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-1 text-right text-xs text-gray-400">
          {description.length}/{MAX_DESCRIPTION}
        </p>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} loading={submitting} disabled={!reason}>
          Submit report
        </Button>
      </div>
    </Modal>
  );
}
