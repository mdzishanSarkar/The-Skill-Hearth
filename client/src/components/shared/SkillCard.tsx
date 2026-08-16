import { Link } from 'react-router-dom';
import type { SkillWithTeacher } from '../../types/skill.types';
import {
  FORMAT_LABELS,
  LENGTH_LABELS,
  PROFICIENCY_LABELS,
} from '../../types/skill.types';
import { getCategoryVisual, getSkillEmoji } from '../../data/skillVisuals';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

interface SkillCardProps {
  skill: SkillWithTeacher;
  isOwner?: boolean;
  onEdit?: (skill: SkillWithTeacher) => void;
  onToggle?: (skill: SkillWithTeacher) => void;
  onDelete?: (skill: SkillWithTeacher) => void;
}

function Rating({ averageRating, reviewCount }: { averageRating: number; reviewCount: number }) {
  if (reviewCount === 0) {
    return <span className="text-xs text-gray-400 dark:text-slate-500">No reviews yet</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
      <span className="inline-flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((value) => (
          <svg
            key={value}
            className={
              value <= Math.round(averageRating)
                ? 'h-3.5 w-3.5 text-amber-400'
                : 'h-3.5 w-3.5 text-gray-300 dark:text-slate-600'
            }
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </span>
      <span className="font-semibold text-gray-800 dark:text-slate-100">{averageRating.toFixed(1)}</span>
      <span className="text-gray-300 dark:text-slate-600">·</span>
      <span>{reviewCount}</span>
    </span>
  );
}

export default function SkillCard({ skill, isOwner = false, onEdit, onToggle, onDelete }: SkillCardProps) {
  const visual = getCategoryVisual(skill.categoryName);
  const emoji = getSkillEmoji(skill.categoryName, skill.skillName);
  const hasAvailability = Boolean(skill.teacher?.availability?.length);

  const detailLink = isOwner ? undefined : `/skills/${skill._id}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-soft transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300/70 hover:shadow-lift dark:border-slate-700/70 dark:bg-slate-900 dark:shadow-none dark:hover:border-indigo-500/50 dark:hover:shadow-[0_18px_40px_rgba(99,102,241,0.16)]">
      <div className={`relative flex h-28 items-center justify-center overflow-hidden border-b border-black/5 bg-linear-to-br ${visual.gradient} dark:border-white/10`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.38),transparent_40%)]" />
        {detailLink ? (
          <Link to={detailLink} className="absolute inset-0 z-10" aria-label={skill.skillName} />
        ) : null}
        <span className="relative z-10 inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-white/25 text-4xl shadow-[0_10px_25px_rgba(15,23,42,0.25)] backdrop-blur-md ring-4 ring-white/25 transition-transform duration-200 group-hover:scale-110">
          {emoji}
        </span>
        <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-1.5">
          <Badge className="border border-white/40 bg-white/25 text-[10px] font-semibold tracking-wide text-white backdrop-blur-md">
            {skill.type === 'teach' ? 'I can teach' : 'I want to learn'}
          </Badge>
          {!skill.isActive && (
            <Badge className="border border-white/40 bg-white/25 text-[10px] font-semibold tracking-wide text-white backdrop-blur-md">
              Paused
            </Badge>
          )}
        </div>
        {skill.distanceKm !== undefined && (
          <span className="absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full border border-white/40 bg-black/20 px-2 py-1 text-[10px] font-semibold tracking-wide text-white backdrop-blur-md">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {skill.distanceKm < 1 ? '<1' : skill.distanceKm} km
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 truncate text-lg font-semibold text-gray-900 dark:text-slate-50">
            {detailLink ? (
              <Link to={detailLink} className="transition-colors hover:text-indigo-600 dark:hover:text-indigo-300">
                {skill.skillName}
              </Link>
            ) : (
              skill.skillName
            )}
          </h3>
        </div>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${visual.text}`}>{skill.categoryName}</p>

        {skill.description && (
          <p className="line-clamp-2 text-sm leading-6 text-gray-600 dark:text-slate-400">{skill.description}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge color={visual.badge}>{PROFICIENCY_LABELS[skill.proficiencyLevel]}</Badge>
          <Badge color="gray">{FORMAT_LABELS[skill.format]}</Badge>
          <Badge color="gray">{LENGTH_LABELS[skill.sessionLength]}</Badge>
        </div>

        {!isOwner && (
          <div className="pt-1">
            <Rating averageRating={skill.stats?.averageRating ?? 0} reviewCount={skill.stats?.reviewCount ?? 0} />
          </div>
        )}

        <div className="mt-auto border-t border-gray-100 pt-3 dark:border-slate-800">
          {isOwner ? (
            (onEdit || onToggle || onDelete) && (
              <div className="flex flex-wrap gap-2">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(skill)}
                    className="inline-flex min-h-9 items-center rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-500/35 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                  >
                    Edit
                  </button>
                )}
                {onToggle && (
                  <button
                    type="button"
                    onClick={() => onToggle(skill)}
                    className="inline-flex min-h-9 items-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {skill.isActive ? 'Pause' : 'Activate'}
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(skill)}
                    className="inline-flex min-h-9 items-center rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                )}
              </div>
            )
          ) : skill.teacher ? (
            <div className="flex items-center gap-3 rounded-xl border border-gray-200/80 bg-gray-50 p-2.5 dark:border-slate-700/70 dark:bg-slate-800/70">
              <Avatar src={skill.teacher.avatar || undefined} name={skill.teacher.displayName} size="sm" />
              <div className="min-w-0 flex-1">
                <Link
                  to={`/profile/${skill.teacher._id}`}
                  className="block truncate text-sm font-semibold text-gray-900 transition-colors hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-300"
                >
                  {skill.teacher.displayName}
                </Link>
                {skill.teacher.location.city && (
                  <p className="truncate text-xs text-gray-500 dark:text-slate-400">{skill.teacher.location.city}</p>
                )}
              </div>
              {hasAvailability && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Available
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
