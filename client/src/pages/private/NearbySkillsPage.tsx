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
import SkillCard from '../../components/shared/SkillCard';
import Pagination from '../../components/shared/Pagination';

const PAGE_SIZE = 20;

const selectClass =
  'rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

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
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<SkillListResult | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, [debouncedQ, categoryId, format, availability, sort]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const coords = user?.location.coordinates;
      const hasCoords = coords && (coords[0] !== 0 || coords[1] !== 0);
      const resultData = await listSkills({
        page,
        limit: PAGE_SIZE,
        q: debouncedQ || undefined,
        categoryId: categoryId || undefined,
        format: format || undefined,
        availability: availability || undefined,
        sort,
        ...(hasCoords ? { lat: coords[1], lng: coords[0], radiusKm: user?.location.radiusPreference } : {}),
      });
      setResult(resultData);
    } catch (err) {
      setResult(null);
      console.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ, categoryId, format, availability, sort, user]);

  useEffect(() => {
    load();
  }, [load]);

  const hasFilters =
    debouncedQ || categoryId || format || availability || sort !== 'newest';

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nearby skills</h1>
          <p className="mt-1 text-sm text-gray-600">
            Find people nearby who can teach what you want to learn.
          </p>
        </div>

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
          <select value={sort} onChange={(e) => setSort(e.target.value as SkillSort)} className={selectClass}>
            <option value="newest">Newest</option>
            <option value="most-reviewed">Most reviewed</option>
            <option value="closest">Closest</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={availability}
              onChange={(e) => setAvailability(e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
            Available now
          </label>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={
                view === 'grid'
                  ? 'rounded-md bg-white px-3 py-1.5 text-sm font-medium text-indigo-600 shadow-sm'
                  : 'rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900'
              }
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={
                view === 'list'
                  ? 'rounded-md bg-white px-3 py-1.5 text-sm font-medium text-indigo-600 shadow-sm'
                  : 'rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900'
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
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-600">No skills match your search. Try clearing some filters.</p>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-gray-500">
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
                <SkillCard key={skill._id} skill={skill} />
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
