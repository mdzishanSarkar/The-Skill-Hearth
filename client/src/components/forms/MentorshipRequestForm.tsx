import { useState } from 'react';
import { requestMentorship } from '../../services/mentorship.service';
import { showError, showSuccess } from '../../utils/toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface MentorshipRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mentorId: string;
  mentorName?: string;
  skillId: string;
  skillName?: string;
}

const DURATION_OPTIONS = [1, 3, 6, 12];
const FREQUENCY_OPTIONS: Array<{ value: 'weekly' | 'biweekly' | 'monthly'; label: string }> = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
];

const inputClass =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export default function MentorshipRequestForm({
  open,
  onClose,
  onSuccess,
  mentorId,
  mentorName,
  skillId,
  skillName,
}: MentorshipRequestFormProps) {
  const [goals, setGoals] = useState<string[]>(['']);
  const [durationMonths, setDurationMonths] = useState(3);
  const [meetingFrequency, setMeetingFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('biweekly');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  function updateGoal(index: number, value: string) {
    setGoals((prev) => prev.map((g, i) => (i === index ? value : g)));
  }

  function addGoal() {
    setGoals((prev) => [...prev, '']);
  }

  function removeGoal(index: number) {
    setGoals((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanGoals = goals.map((g) => g.trim()).filter(Boolean);
    if (cleanGoals.length === 0) {
      showError('Add at least one learning goal');
      return;
    }
    setSubmitting(true);
    try {
      await requestMentorship({
        mentorId,
        skillId,
        goals: cleanGoals.map((title) => ({ title })),
        durationMonths,
        meetingFrequency,
      });
      showSuccess('Mentorship request sent!');
      onClose();
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send mentorship request';
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Request mentorship">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Request a longer-term learning relationship with <span className="font-semibold text-gray-900 dark:text-gray-100">{mentorName || 'this teacher'}</span>
          {skillName ? <> for <span className="font-semibold text-gray-900 dark:text-gray-100">{skillName}</span></> : null}.
        </p>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Learning goals *
          </label>
          <div className="space-y-2">
            {goals.map((goal, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => updateGoal(index, e.target.value)}
                  maxLength={120}
                  placeholder={`Goal ${index + 1} — e.g., Confidently bake a sourdough loaf`}
                  className={inputClass}
                />
                {goals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGoal(index)}
                    aria-label="Remove goal"
                    className="rounded-md p-2 text-sm text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-red-400"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {goals.length < 5 && (
            <button
              type="button"
              onClick={addGoal}
              className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
            >
              + Add goal
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Duration
            </label>
            <select
              value={durationMonths}
              onChange={(e) => setDurationMonths(Number(e.target.value))}
              className={inputClass}
            >
              {DURATION_OPTIONS.map((months) => (
                <option key={months} value={months}>
                  {months} month{months === 1 ? '' : 's'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Meeting frequency
            </label>
            <select
              value={meetingFrequency}
              onChange={(e) => setMeetingFrequency(e.target.value as typeof meetingFrequency)}
              className={inputClass}
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Send request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
