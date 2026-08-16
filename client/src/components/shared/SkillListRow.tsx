import { Link } from 'react-router-dom';
import type { SkillWithTeacher } from '../../types/skill.types';
import { FORMAT_LABELS, LENGTH_LABELS, PROFICIENCY_LABELS } from '../../types/skill.types';
import { getCategoryVisual, getSkillEmoji } from '../../data/skillVisuals';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

interface SkillListRowProps {
  skill: SkillWithTeacher;
}

export default function SkillListRow({ skill }: SkillListRowProps) {
  const visual = getCategoryVisual(skill.categoryName);
  const hasAvailability = Boolean(skill.teacher?.availability?.length);
  const hasReviews = (skill.teacher?.stats?.reviewCount ?? 0) > 0;

  return (
    <article className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md">
      <Link to={`/skills/${skill._id}`} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${visual.gradient} sm:h-14 sm:w-14`}
        >
          <span className="text-3xl drop-shadow-sm transition-transform group-hover:scale-110 sm:text-2xl">
            {getSkillEmoji(skill.categoryName, skill.skillName)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600">
              {skill.skillName}
            </h3>
            <span className={`text-xs font-medium ${visual.text}`}>{skill.categoryName}</span>
          </div>
          {skill.description && (
            <p className="mt-1 line-clamp-1 text-sm text-gray-500 dark:text-gray-400">{skill.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge color={skill.type === 'teach' ? 'indigo' : 'green'}>
              {skill.type === 'teach' ? 'Can teach' : 'Wants to learn'}
            </Badge>
            <Badge color={visual.badge}>{PROFICIENCY_LABELS[skill.proficiencyLevel]}</Badge>
            <Badge color="gray">{FORMAT_LABELS[skill.format]}</Badge>
            <Badge color="gray">{LENGTH_LABELS[skill.sessionLength]}</Badge>
          </div>
        </div>

        {skill.teacher && (
          <div className="flex items-center gap-2.5 sm:w-48 sm:shrink-0 sm:border-l sm:border-gray-100 sm:pl-4">
            <Avatar
              src={skill.teacher.avatar || undefined}
              name={skill.teacher.displayName}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{skill.teacher.displayName}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                {hasAvailability && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
                    Available
                  </span>
                )}
                {hasReviews && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    ⭐ {(skill.teacher.stats.averageRating ?? 0).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between sm:w-28 sm:shrink-0 sm:flex-col sm:items-end sm:justify-center sm:gap-2">
          {skill.distanceKm !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
              📍 {skill.distanceKm < 1 ? '<1' : skill.distanceKm} km
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 opacity-0 transition-opacity group-hover:opacity-100">
            View
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>
    </article>
  );
}
