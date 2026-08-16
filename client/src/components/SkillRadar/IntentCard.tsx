import { useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { FiChevronDown, FiChevronUp, FiPause, FiPlay, FiX } from 'react-icons/fi';
import { getSkillEmoji } from '../../data/skillVisuals';
import { FORMAT_LABELS } from '../../types/skill.types';
import { getIntentMatches, updateIntentStatus } from '../../services/skillRadar.service';
import type { RadarIntent, RadarIntentStatus } from '../../types/radar.types';
import type { SkillWithTeacher } from '../../types/skill.types';
import { getApiError } from '../../types/api.types';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import Avatar from '../ui/Avatar';

const CONFIDENCE_STYLES: Record<RadarIntent['confidence'], string> = {
  high: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

const CONFIDENCE_LABEL: Record<RadarIntent['confidence'], string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};

function MatchRow({ skill }: { skill: SkillWithTeacher }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 dark:bg-gray-800">
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
      {skill.teacher && (
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Avatar src={skill.teacher.avatar} name={skill.teacher.displayName} size="sm" />
          {skill.teacher.displayName}
        </span>
      )}
    </li>
  );
}

interface IntentCardProps {
  intent: RadarIntent;
  onChanged: (intent: RadarIntent) => void;
}

export default function IntentCard({ intent, onChanged }: IntentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [matches, setMatches] = useState<SkillWithTeacher[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [updating, setUpdating] = useState(false);

  const paused = intent.status !== 'active';

  async function handleStatusChange(status: RadarIntentStatus) {
    setUpdating(true);
    try {
      const intents = await updateIntentStatus(intent.category, status);
      const updated = intents.find((i) => i.category === intent.category);
      if (updated) onChanged(updated);
      toast.success(status === 'dismissed' ? 'Intent dismissed' : status === 'paused' ? 'Intent paused' : 'Intent resumed');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setUpdating(false);
    }
  }

  async function toggleMatches() {
    const next = !expanded;
    setExpanded(next);
    if (next && matches.length === 0) {
      setLoadingMatches(true);
      try {
        setMatches(await getIntentMatches(intent.category, 5));
      } catch (err) {
        toast.error(getApiError(err));
      } finally {
        setLoadingMatches(false);
      }
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            {getSkillEmoji(intent.category, intent.inferredSkillNames[0] ?? '')}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{intent.category}</h3>
              <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', CONFIDENCE_STYLES[intent.confidence])}>
                {CONFIDENCE_LABEL[intent.confidence]}
              </span>
              <Badge color={intent.matchCount > 0 ? 'indigo' : 'gray'}>
                {intent.matchCount} match{intent.matchCount === 1 ? '' : 'es'}
              </Badge>
              {paused && (
                <Badge color="amber">Paused</Badge>
              )}
            </div>
            {intent.reasoning && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{intent.reasoning}</p>}
            {intent.inferredSkillNames.length > 0 && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Interested in: {intent.inferredSkillNames.slice(0, 4).join(', ')}
                {intent.inferredSkillNames.length > 4 ? '…' : ''}
              </p>
            )}
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              Format: {FORMAT_LABELS[intent.preferredFormat] ?? intent.preferredFormat}
              {intent.preferredRadius ? ` · within ${intent.preferredRadius} km` : ''}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => handleStatusChange(paused ? 'active' : 'paused')}
            disabled={updating}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
          >
            {paused ? <FiPlay /> : <FiPause />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange('dismissed')}
            disabled={updating}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <FiX /> Dismiss
          </button>
        </div>
      </div>

      <div className="mt-3 border-t border-gray-100 pt-2 dark:border-gray-800">
        <button type="button" onClick={toggleMatches} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
          {expanded ? <FiChevronUp /> : <FiChevronDown />}
          {expanded ? 'Hide matches' : 'View matches'}
        </button>
        {expanded && (
          <div className="mt-2">
            {loadingMatches ? (
              <div className="flex justify-center py-3">
                <Spinner size="sm" />
              </div>
            ) : matches.length > 0 ? (
              <ul className="space-y-1.5">
                {matches.map((skill) => (
                  <MatchRow key={skill._id} skill={skill} />
                ))}
              </ul>
            ) : (
              <p className="py-2 text-xs text-gray-400 dark:text-gray-500">
                No matching skills right now. Check back soon!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
