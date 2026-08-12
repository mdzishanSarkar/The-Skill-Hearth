import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { updateMe } from '../../services/users.service';
import { getApiError } from '../../types/api.types';
import type { UserQuietHours } from '../../types/user.types';
import Button from '../ui/Button';

const DEFAULTS: UserQuietHours = { enabled: false, startTime: '22:00', endTime: '07:00', timezone: '' };

export default function QuietHoursSettings() {
  const { user, setUser } = useAuth();
  const [quietHours, setQuietHours] = useState<UserQuietHours>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.quietHours) {
      setQuietHours({ ...DEFAULTS, ...user.quietHours });
    }
  }, [user?.quietHours]);

  function update(patch: Partial<UserQuietHours>) {
    setQuietHours((prev) => ({ ...prev, ...patch }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateMe({ quietHours });
      setUser?.(updated);
      toast.success('Quiet hours saved');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Quiet Hours</h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        During quiet hours we hold non-urgent notifications and messages until the morning.
      </p>

      <label className="mt-4 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={quietHours.enabled}
          onChange={(e) => update({ enabled: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        Enable quiet hours
      </label>

      {quietHours.enabled && (
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">From</label>
            <input
              type="time"
              value={quietHours.startTime}
              onChange={(e) => update({ startTime: e.target.value })}
              className="mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">To</label>
            <input
              type="time"
              value={quietHours.endTime}
              onChange={(e) => update({ endTime: e.target.value })}
              className="mt-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="min-w-40 flex-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              Timezone <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              value={quietHours.timezone}
              onChange={(e) => update({ timezone: e.target.value })}
              placeholder={Intl.DateTimeFormat().resolvedOptions().timeZone}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      <Button variant="secondary" size="sm" className="mt-4" loading={saving} onClick={handleSave}>
        Save quiet hours
      </Button>
    </div>
  );
}
