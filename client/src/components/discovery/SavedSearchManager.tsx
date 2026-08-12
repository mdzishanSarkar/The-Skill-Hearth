import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  listSavedSearches,
  saveSearch,
  updateSavedSearch,
  deleteSavedSearch,
} from '../../services/savedSearch.service';
import type { SavedSearchItem } from '../../types/discovery.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';

export default function SavedSearchManager() {
  const [searches, setSearches] = useState<SavedSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSearches();
  }, []);

  async function loadSearches() {
    try {
      const data = await listSavedSearches();
      setSearches(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Search name is required');
      return;
    }
    setSaving(true);
    try {
      await saveSearch(name, {}, alertEnabled);
      toast.success('Search saved!');
      setName('');
      setAlertEnabled(false);
      setShowForm(false);
      loadSearches();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAlert(searchId: string, current: boolean) {
    try {
      await updateSavedSearch(searchId, { alertEnabled: !current });
      setSearches((prev) =>
        prev.map((s) => (s._id === searchId ? { ...s, alertEnabled: !current } : s))
      );
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleDelete(searchId: string) {
    try {
      await deleteSavedSearch(searchId);
      setSearches((prev) => prev.filter((s) => s._id !== searchId));
      toast.success('Search deleted');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  if (loading) return <Spinner size="sm" />;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Saved Searches</h3>
        <Button variant="secondary" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Save current search'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mt-4 space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Search name"
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={alertEnabled}
              onChange={(e) => setAlertEnabled(e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
            Notify me when new skills match
          </label>
          <Button type="submit" size="sm" loading={saving}>
            Save
          </Button>
        </form>
      )}

      {searches.length === 0 && !showForm ? (
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">No saved searches.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {searches.map((s) => (
            <li key={s._id} className="flex items-center justify-between rounded-md bg-gray-50 dark:bg-gray-900 px-3 py-2">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.name}</span>
                {s.alertEnabled && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 text-xs text-green-700 dark:text-green-300">
                    Alerts on
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAlert(s._id, s.alertEnabled)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
                >
                  {s.alertEnabled ? 'Disable alerts' : 'Enable alerts'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(s._id)}
                  className="text-xs text-red-500 dark:text-red-400 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
