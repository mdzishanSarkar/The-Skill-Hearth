import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getNeighborhoodPage } from '../../services/discoveryEnhanced.service';
import type { NeighborhoodPage } from '../../types/discovery.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import { FiMapPin } from 'react-icons/fi';

export default function NeighborhoodPageView() {
  const { city, neighborhood } = useParams<{ city: string; neighborhood?: string }>();
  const [data, setData] = useState<NeighborhoodPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!city) return;
    setLoading(true);
    getNeighborhoodPage(city, neighborhood)
      .then(setData)
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  }, [city, neighborhood]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Neighborhood not found</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{error || 'No skills found in this area.'}</p>
        <Link to="/skills" className="mt-6 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
          Browse all skills
        </Link>
      </div>
    );
  }

  const displayName = data.neighborhood
    ? `${data.neighborhood}, ${data.city}`
    : data.city;

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiMapPin />}
        title={`Skills in ${displayName}`}
        subtitle={`${data.skillCount} skill${data.skillCount === 1 ? '' : 's'} from ${data.teacherCount} teacher${data.teacherCount === 1 ? '' : 's'}`}
      />

      {data.topCategories.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Popular categories</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.topCategories.map((cat) => (
              <Link
                key={cat.name}
                to={`/skills?category=${encodeURIComponent(cat.name)}`}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              >
                {cat.name}
                <span className="text-xs text-gray-400 dark:text-gray-500">({cat.count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {data.recentSkills.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent skills</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.recentSkills.map((skill) => (
              <Link
                key={String(skill._id)}
                to={`/skills/${String(skill._id)}`}
                className="card card-hover p-4"
              >
                <div className="flex items-center gap-2">
                  <Badge color={skill.type === 'teach' ? 'indigo' : 'green'}>
                    {skill.type === 'teach' ? 'Teach' : 'Learn'}
                  </Badge>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{String(skill.categoryName)}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{String(skill.skillName)}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {skill.stats && typeof skill.stats === 'object'
                    ? `${(skill.stats as Record<string, unknown>).averageRating ?? 0} rating`
                    : 'No reviews yet'}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
