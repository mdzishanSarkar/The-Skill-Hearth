import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiRepeat } from 'react-icons/fi';
import { getSwapReadyMatches } from '../../services/swapReady.service';
import type { SwapReadyMatch } from '../../types/swapReady.types';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';

export default function SwapReadyMatchesSection() {
  const [matches, setMatches] = useState<SwapReadyMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSwapReadyMatches(3)
      .then(setMatches)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      </div>
    );
  }

  if (matches.length === 0) return null;

  return (
    <div className="card mt-8 p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
          <FiRepeat className="h-4 w-4 text-indigo-500" />
          Swap-ready matches
        </h2>
        <Link to="/swap-ready-matches" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
          View all <FiArrowRight />
        </Link>
      </div>
      <ul className="mt-4 space-y-3">
        {matches.map((match) => {
          const them = match.userIsA ? match.userBId : match.userAId;
          const theirSkill = match.userIsA ? match.userBTeachesSkillId : match.userATeachesSkillId;
          const mySkill = match.userIsA ? match.userATeachesSkillId : match.userBTeachesSkillId;
          return (
            <li key={match._id} className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/60">
              <Avatar src={them.avatar} name={them.displayName} />
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium text-gray-900 dark:text-gray-100">{them.displayName}</p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {theirSkill.skillName} ↔ {mySkill.skillName}
                </p>
              </div>
              <Link to="/swap-ready-matches" className="shrink-0 text-xs text-indigo-600 hover:underline dark:text-indigo-400">
                View
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
