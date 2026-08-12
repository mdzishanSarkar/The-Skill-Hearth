import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getCategories, listSkills } from '../../services/skills';
import { getApiError } from '../../types/api.types';
import type {
  Category,
  SessionFormat,
  SkillListResult,
  SkillSort,
  SkillWithTeacher,
} from '../../types/skill.types';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/ui/PageHeader';
import { FiMapPin } from 'react-icons/fi';
import SkillCard from '../../components/shared/SkillCard';
import SkillListRow from '../../components/shared/SkillListRow';
import Pagination from '../../components/shared/Pagination';
import SmartMatchPanel from '../../components/discovery/SmartMatchPanel';

const PAGE_SIZE = 20;

const DISTANCE_OPTIONS = [5, 10, 25, 50, 100] as const;

const selectClass =
  'rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500';

export default function NearbySkillsPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [format, setFormat] = useState<SessionFormat | ''>('');
  const [availability, setAvailability] = useState(false);
  const [sort, setSort] = useState<SkillSort>('newest');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [distance, setDistance] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SkillListResult | null>(null);
  const [loading, setLoading] = useState(true);

  const coords = user?.location.coordinates;
  const hasCoords = Boolean(coords && (coords[0] !== 0 || coords[1] !== 0));

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, categoryId, format, availability, sort, distance]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const locationCoords = user?.location.coordinates;
      const hasGeo = Boolean(locationCoords && (locationCoords[0] !== 0 || locationCoords[1] !== 0));
      const radiusKm = hasGeo
        ? distance === ''
          ? user?.location.radiusPreference
          : distance === 0
            ? undefined
            : distance
        : undefined;
      const resultData = await listSkills({
        page,
        limit: PAGE_SIZE,
        q: debouncedQ || undefined,
        categoryId: categoryId || undefined,
        format: format || undefined,
        availability: availability || undefined,
        sort,
        ...(hasGeo && locationCoords ? { lat: locationCoords[1], lng: locationCoords[0], radiusKm } : {}),
      });
      setResult(resultData);
    } catch (err) {
      setResult(null);
      console.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ, categoryId, format, availability, sort, distance, user]);

  useEffect(() => {
    load();
  }, [load]);

  const hasFilters =
    debouncedQ || categoryId || format || availability || distance !== '' || sort !== 'newest';

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiMapPin />}
        title="Nearby skills"
        subtitle="Find people nearby who can teach what you want to learn."
      />
      <div className="mt-4">
        <SmartMatchPanel />
      </div>

      <div className="mt-6 flex flex-col gap-4">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1">
            <Input
              placeholder="Search skills…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectClass}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          <select value={format} onChange={(e) => setFormat(e.target.value as SessionFormat | '')} className={selectClass}>
            <option value="">Any format</option>
            <option value="in-person">In-person</option>
            <option value="online">Online</option>
            <option value="either">Either</option>
          </select>
          <select
            value={distance}
            onChange={(e) => setDistance(e.target.value === '' ? '' : Number(e.target.value))}
            className={selectClass}
            disabled={!hasCoords}
            title={hasCoords ? 'Filter by distance' : 'Set your location to filter by distance'}
          >
            <option value="">Nearby (my radius)</option>
            {DISTANCE_OPTIONS.map((km) => (
              <option key={km} value={km}>
                Within {km} km
              </option>
            ))}
            <option value="0">Any distance</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as SkillSort)} className={selectClass}>
            <option value="newest">Newest</option>
            <option value="most-reviewed">Most reviewed</option>
            <option value="closest">Closest</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={availability}
              onChange={(e) => setAvailability(e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
            Available now
          </label>
          <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={
                view === 'grid'
                  ? 'rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50'
              }
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={
                view === 'list'
                  ? 'rounded-md bg-white dark:bg-gray-900 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50'
              }
            >
              List
            </button>
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ('');
                setCategoryId('');
                setFormat('');
                setAvailability(false);
                setDistance('');
                setSort('newest');
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : !result || result.skills.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
          <p className="text-gray-600 dark:text-gray-400">No skills match your search. Try clearing some filters.</p>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            {result.total} skill{result.total === 1 ? '' : 's'} found
          </p>
          {view === 'grid' ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.skills.map((skill: SkillWithTeacher) => (
                <SkillCard key={skill._id} skill={skill} />
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {result.skills.map((skill: SkillWithTeacher) => (
                <SkillListRow key={skill._id} skill={skill} />
              ))}
            </div>
          )}
          <div className="mt-8">
            <Pagination page={result.page} totalPages={result.totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
