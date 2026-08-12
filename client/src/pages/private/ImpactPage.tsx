import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiAward, FiBarChart2, FiBookOpen, FiMapPin, FiStar, FiUsers } from 'react-icons/fi';
import { getMyImpact } from '../../services/impact.service';
import type { ImpactData } from '../../types/impact.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';

export default function ImpactPage() {
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyImpact()
      .then(setImpact)
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!impact) {
    return (
      <div className="page-shell py-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">Could not load your impact summary.</p>
      </div>
    );
  }

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiBarChart2 />}
        title="Your Impact"
        subtitle="A look at the good you've brought to your community through the Hearth."
      />

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon={<FiAward />} label="Sessions taught" value={impact.teaching.sessionsTaught} hint="lifetime" tone="indigo" />
        <StatCard icon={<FiUsers />} label="Learners helped" value={impact.teaching.learnersHelped} hint="unique learners" tone="amber" />
        <StatCard icon={<FiBarChart2 />} label="Hours contributed" value={impact.teaching.hoursContributed} hint="teaching time" tone="emerald" />
        <StatCard icon={<FiMapPin />} label="Neighbourhoods reached" value={impact.teaching.neighborhoodsReached} tone="sky" />
        <StatCard icon={<FiAward />} label="Active teaching skills" value={impact.teaching.activeSkills} tone="violet" />
        <StatCard icon={<FiBookOpen />} label="Sessions learned" value={impact.learning.sessionsLearned} tone="rose" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {impact.reviews.averageRating.toFixed(1)}
          </p>
          <p className="mt-1 flex items-center justify-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400">
            <FiStar className="h-4 w-4 text-amber-500" /> Average rating
          </p>
          <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
            {impact.reviews.totalReviews} review{impact.reviews.totalReviews === 1 ? '' : 's'}
          </p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {impact.teaching.neighborhoods.length}
          </p>
          <p className="mt-1 flex items-center justify-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400">
            <FiMapPin className="h-4 w-4 text-indigo-500" /> Communities reached
          </p>
          {impact.teaching.neighborhoods.length > 0 && (
            <p className="mt-1 line-clamp-1 text-[11px] text-gray-400 dark:text-gray-500">
              {impact.teaching.neighborhoods.slice(0, 3).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {impact.teaching.neighborhoods.length > 0 && (
        <div className="card mt-6 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Neighbourhoods you've reached</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {impact.teaching.neighborhoods.map((n) => (
              <span
                key={n}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
        Keep sharing your skills — your impact grows with every session. You can track your journey{' '}
        <Link to="/journal" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
          in your journal
        </Link>
        .
      </p>
    </div>
  );
}
