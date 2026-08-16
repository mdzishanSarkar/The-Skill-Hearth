import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiThermometer } from 'react-icons/fi';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { getDemandHeatmap } from '../../services/skillDemand.service';
import { getApiError } from '../../types/api.types';
import { getSkillEmoji } from '../../data/skillVisuals';
import type { DemandSkill, DemandSnapshot } from '../../types/demand.types';

function heatColor(ratio: number): string {
  if (ratio >= 0.75) return 'bg-red-500';
  if (ratio >= 0.5) return 'bg-orange-400';
  if (ratio >= 0.25) return 'bg-amber-400';
  return 'bg-yellow-300';
}

function DemandRow({ skill, max, rank }: { skill: DemandSkill; max: number; rank: number }) {
  const ratio = max > 0 ? skill.demandScore / max : 0;
  return (
    <li className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <span className="w-6 shrink-0 text-center text-xs font-semibold text-gray-400">{rank}</span>
        <span className="text-xl" aria-hidden="true">
          {getSkillEmoji(skill.categoryName, skill.skillName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{skill.skillName}</p>
            <p className="shrink-0 text-xs font-semibold text-gray-500 dark:text-gray-400">
              {skill.demandScore} learner{skill.demandScore === 1 ? '' : 's'}
            </p>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${heatColor(ratio)}`}
              style={{ width: `${Math.max(4, ratio * 100)}%` }}
            />
          </div>
          <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
            {skill.categoryName}
            {skill.topRegions.length > 0 && (
              <>
                {' · '}
                {skill.topRegions.map((r) => `${r.name} (${r.count})`).join(', ')}
              </>
            )}
          </p>
        </div>
      </div>
    </li>
  );
}

export default function DemandHeatmapPage() {
  const [snapshot, setSnapshot] = useState<DemandSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      setSnapshot(await getDemandHeatmap());
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiThermometer />}
        title="Skill Demand Heatmap"
        subtitle="Where the Hearth is hottest — the skills neighbours want to learn most, based on the last 30 days."
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" />
        </div>
      ) : !snapshot || snapshot.skills.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiThermometer />}
          title="No demand data yet"
          description="Once neighbours add learn skills, the heatmap will light up here."
        />
      ) : (
        <>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Updated{' '}
            {snapshot.generatedAt
              ? new Date(snapshot.generatedAt).toLocaleDateString()
              : ''}{' '}
            · window {new Date(snapshot.windowStart).toLocaleDateString()} –{' '}
            {new Date(snapshot.windowEnd).toLocaleDateString()}
          </p>
          <ul className="mt-4 space-y-2">
            {snapshot.skills.map((skill, index) => (
              <DemandRow key={`${skill.categoryName}-${skill.skillName}`} skill={skill} max={snapshot.skills[0].demandScore} rank={index + 1} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
