import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiThermometer } from 'react-icons/fi';
import { getDemandHeatmap } from '../../services/skillDemand.service';
import type { DemandSkill } from '../../types/demand.types';
import Spinner from '../ui/Spinner';

export default function DemandWidget() {
  const [skills, setSkills] = useState<DemandSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDemandHeatmap()
      .then((snapshot) => setSkills(snapshot.skills.slice(0, 3)))
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

  if (skills.length === 0) return null;

  return (
    <div className="card mt-8 p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
          <FiThermometer className="h-4 w-4 text-orange-500" />
          Trending skills in demand
        </h2>
        <Link to="/demand" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
          Heatmap <FiArrowRight />
        </Link>
      </div>
      <ul className="mt-4 space-y-2">
        {skills.map((skill) => (
          <li key={`${skill.categoryName}-${skill.skillName}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
            <span className="truncate text-sm text-gray-900 dark:text-gray-100">{skill.skillName}</span>
            <span className="ml-3 shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
              {skill.demandScore} learner{skill.demandScore === 1 ? '' : 's'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
