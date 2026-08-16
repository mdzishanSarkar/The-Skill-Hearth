import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  listSavedSearches,
  saveSearch,
  updateSavedSearch,
  deleteSavedSearch,
  getSearchMatches,
} from '../../services/savedSearch.service';
import type { SavedSearchItem } from '../../types/discovery.types';
import type { SkillListResult, SkillWithTeacher } from '../../types/skill.types';
import { FORMAT_LABELS } from '../../types/skill.types';
import { getSkillEmoji } from '../../data/skillVisuals';
import { getApiError } from '../../types/api.types';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

const FILTER_SELECTS = [
  {
    key: 'type',
    label: 'Type',
    options: [
      { value: 'teach', label: 'Teach' },
      { value: 'learn', label: 'Learn' },
    ],
  },
  {
    key: 'format',
    label: 'Format',
    options: [
      { value: 'in-person', label: 'In person' },
      { value: 'online', label: 'Online' },
      { value: 'either', label: 'Either' },
    ],
  },
  {
    key: 'proficiencyLevel',
    label: 'Level',
    options: [
      { value: 'beginner', label: 'Beginner' },
      { value: 'intermediate', label: 'Intermediate' },
      { value: 'advanced', label: 'Advanced' },
    ],
  },
] as const;

const selectClass =
  'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none';

type FilterForm = Omit<SavedSearchItem['filters'], 'type' | 'format' | 'proficiencyLevel'> & {
  category: string;
  type: '' | 'teach' | 'learn';
  format: '' | 'in-person' | 'online' | 'either';
  proficiencyLevel: '' | 'beginner' | 'intermediate' | 'advanced';
};

function buildFilters(form: FilterForm): SavedSearchItem['filters'] {
  const filters: SavedSearchItem['filters'] = {};
  if (form.category.trim()) filters.category = form.category.trim();
  if (form.type) filters.type = form.type;
  if (form.format) filters.format = form.format;
  if (form.proficiencyLevel) filters.proficiencyLevel = form.proficiencyLevel;
  if (form.radius) filters.radius = form.radius;
  return filters;
}

function filterSummary(s: SavedSearchItem): string {
  const parts: string[] = [];
  if (s.filters.category) parts.push(s.filters.category);
  if (s.filters.type) parts.push(s.filters.type);
  if (s.filters.format) parts.push(s.filters.format);
  if (s.filters.proficiencyLevel) parts.push(s.filters.proficiencyLevel);
  if (s.filters.radius) parts.push(`${s.filters.radius} km`);
  return parts.length ? parts.join(' · ') : 'All skills';
}

function MatchRow({ skill }: { skill: SkillWithTeacher }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md bg-white dark:bg-gray-800 px-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-lg" aria-hidden="true">
          {getSkillEmoji(skill.categoryName, skill.skillName)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{skill.skillName}</p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {skill.categoryName}
            {skill.format ? ` · ${FORMAT_LABELS[skill.format] ?? skill.format}` : ''}
            {typeof skill.distanceKm === 'number' ? ` · ${skill.distanceKm} km` : ''}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {skill.teacher && (
          <span className="hidden items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 sm:flex">
            <Avatar src={skill.teacher.avatar} name={skill.teacher.displayName} size="sm" />
            {skill.teacher.displayName}
          </span>
        )}
      </div>
    </li>
  );
}

export default function SavedSearchManager() {
  const [searches, setSearches] = useState<SavedSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'' | 'teach' | 'learn'>('');
  const [format, setFormat] = useState<'' | 'in-person' | 'online' | 'either'>('');
  const [proficiencyLevel, setProficiencyLevel] = useState<'' | 'beginner' | 'intermediate' | 'advanced'>('');
  const [radius, setRadius] = useState('');
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [matches, setMatches] = useState<Record<string, SkillListResult>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loadingMatches, setLoadingMatches] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSearches();
  }, []);

  async function loadSearches() {
    try {
      const data = await listSavedSearches();
      setSearches(data);
      // Fetch a live match count for each saved search (limit 1 is enough for `total`).
      const countResults = await Promise.allSettled(
        data.map((s) => getSearchMatches(s._id, { limit: 1 })),
      );
      const nextTotals: Record<string, number> = {};
      countResults.forEach((res, i) => {
        if (res.status === 'fulfilled') nextTotals[data[i]._id] = res.value.total;
      });
      setTotals(nextTotals);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleMatches(searchId: string) {
    const next = !expanded[searchId];
    setExpanded((prev) => ({ ...prev, [searchId]: next }));
    if (next && !matches[searchId]) {
      setLoadingMatches((prev) => ({ ...prev, [searchId]: true }));
      try {
        const result = await getSearchMatches(searchId, { limit: 20 });
        setMatches((prev) => ({ ...prev, [searchId]: result }));
        setTotals((prev) => ({ ...prev, [searchId]: result.total }));
      } catch (err) {
        toast.error(getApiError(err));
      } finally {
        setLoadingMatches((prev) => ({ ...prev, [searchId]: false }));
      }
    }
  }

  function resetForm() {
    setName('');
    setCategory('');
    setType('');
    setFormat('');
    setProficiencyLevel('');
    setRadius('');
    setAlertEnabled(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Search name is required');
      return;
    }
    setSaving(true);
    try {
      const created = await saveSearch(name, buildFilters({ category, type, format, proficiencyLevel, radius: radius ? Number(radius) : undefined }), alertEnabled);
      toast.success('Search saved!');
      resetForm();
      setShowForm(false);
      setSearches((prev) => [created, ...prev]);
      const count = await getSearchMatches(created._id, { limit: 1 });
      setTotals((prev) => ({ ...prev, [created._id]: count.total }));
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
          {showForm ? 'Cancel' : 'New saved search'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mt-4 space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Search name"
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Food & Cooking"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Radius (km)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                placeholder="e.g. 10"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
              />
            </div>
            {FILTER_SELECTS.map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{f.label}</label>
                <select
                  value={f.key === 'type' ? type : f.key === 'format' ? format : proficiencyLevel}
                  onChange={(e) => {
                    const value = e.target.value as typeof type;
                    if (f.key === 'type') setType(value as typeof type);
                    else if (f.key === 'format') setFormat(value as typeof format);
                    else setProficiencyLevel(value as typeof proficiencyLevel);
                  }}
                  className={selectClass}
                >
                  <option value="">Any</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
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
          {searches.map((s) => {
            const count = totals[s._id];
            const matchList = matches[s._id];
            const isOpen = expanded[s._id];
            return (
              <li key={s._id} className="rounded-md bg-gray-50 dark:bg-gray-900 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{s.name}</span>
                      {typeof count === 'number' && (
                        <span
                          className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs ${
                            count > 0
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {count} match{count === 1 ? '' : 'es'}
                        </span>
                      )}
                      {s.alertEnabled && (
                        <span className="shrink-0 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 text-xs text-green-700 dark:text-green-300">
                          Alerts on
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{filterSummary(s)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleMatches(s._id)}
                      className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
                    >
                      {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                      {isOpen ? 'Hide matches' : 'View matches'}
                    </button>
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
                </div>
                {isOpen && (
                  <div className="mt-2 border-t border-gray-200 dark:border-gray-800 pt-2">
                    {loadingMatches[s._id] ? (
                      <div className="flex justify-center py-2">
                        <Spinner size="sm" />
                      </div>
                    ) : matchList && matchList.skills.length > 0 ? (
                      <>
                        <ul className="space-y-1.5">
                          {matchList.skills.map((skill) => (
                            <MatchRow key={skill._id} skill={skill} />
                          ))}
                        </ul>
                        {matchList.total > matchList.skills.length && (
                          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                            Showing {matchList.skills.length} of {matchList.total} matches
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="py-2 text-xs text-gray-400 dark:text-gray-500">
                        No matching skills right now. Check back soon!
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
