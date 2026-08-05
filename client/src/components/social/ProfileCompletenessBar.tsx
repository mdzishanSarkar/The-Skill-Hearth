import { useEffect, useState } from 'react';
import { getProfileCompleteness } from '../../services/social.service';
import type { ProfileCompleteness } from '../../types/social.types';

export default function ProfileCompletenessBar() {
  const [data, setData] = useState<ProfileCompleteness | null>(null);

  useEffect(() => {
    getProfileCompleteness().then(setData).catch(() => {});
  }, []);

  if (!data || data.score >= 100) return null;

  const color =
    data.score >= 80 ? 'bg-green-500' :
    data.score >= 50 ? 'bg-amber-500' :
    'bg-red-500';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Profile completeness</h3>
        <span className="text-sm font-semibold text-gray-700">{data.score}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${data.score}%` }}
        />
      </div>
      {data.suggestions.length > 0 && (
        <ul className="mt-3 space-y-1">
          {data.suggestions.slice(0, 3).map((suggestion, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
              <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
