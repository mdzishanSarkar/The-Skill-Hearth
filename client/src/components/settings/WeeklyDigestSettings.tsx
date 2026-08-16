import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiMail } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { updateMe } from '../../services/users.service';
import { getApiError } from '../../types/api.types';
import Button from '../ui/Button';

export default function WeeklyDigestSettings() {
  const { user, setUser } = useAuth();
  const [enabled, setEnabled] = useState(user?.weeklyDigest ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateMe({ weeklyDigest: enabled });
      setUser?.(updated);
      toast.success(enabled ? 'Weekly digest on' : 'Weekly digest off');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
        <FiMail className="h-4 w-4 text-indigo-500" />
        Weekly Digest
      </h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Every Monday we send a digest of new skills matching your Skill Radar, straight to your notifications.
      </p>

      <label className="mt-4 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        Receive the weekly digest
      </label>

      <Button variant="secondary" size="sm" className="mt-4" loading={saving} onClick={handleSave}>
        Save preference
      </Button>
    </div>
  );
}
