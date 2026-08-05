import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSmartMatches } from '../../services/discoveryEnhanced.service';
import type { SmartMatch } from '../../types/discovery.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../ui/Spinner';

export default function SmartMatchPanel() {
  const [matches, setMatches] = useState<SmartMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    try {
      const data = await getSmartMatches(5);
      setMatches(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Spinner size="sm" />;
  if (matches.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Recommended for you</h3>
      <p className="mt-1 text-xs text-gray-500">
        People near you who teach what you want to learn
      </p>
      <div className="mt-4 space-y-3">
        {matches.map((m) => (
          <Link
            key={`${m.userId}-${m.skillId}`}
            to={`/skills/${m.skillId}`}
            className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:border-indigo-200 hover:bg-indigo-50/40"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{m.skillName}</p>
              <p className="text-xs text-gray-500">
                by {m.displayName} · {m.categoryName}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                {m.distanceKm < 999 && <span>{m.distanceKm} km</span>}
                {m.rating > 0 && (
                  <span className="flex items-center gap-0.5">
                    <svg className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {m.rating.toFixed(1)} ({m.reviewCount})
                  </span>
                )}
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
              {Math.round(m.matchScore * 100)}% match
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
