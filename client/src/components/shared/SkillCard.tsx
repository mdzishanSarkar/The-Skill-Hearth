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
  if (reviewCount === 0) return <span className="text-xs text-gray-400">No reviews yet</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
      <span className="inline-flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((value) => (
          <svg
            key={value}
            className={value <= Math.round(averageRating) ? 'h-3.5 w-3.5 text-amber-400' : 'h-3.5 w-3.5 text-gray-300'}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </span>
      <span>{averageRating.toFixed(1)}</span>
      <span>·</span>
      <span>{reviewCount}</span>
    </span>
  );
}

export default function SkillCard({ skill, isOwner = false, onEdit, onToggle, onDelete }: SkillCardProps) {
  const visual = getCategoryVisual(skill.categoryName);
  const emoji = getSkillEmoji(skill.categoryName, skill.skillName);
  const hasAvailability = Boolean(skill.teacher?.availability.length);

  const detailLink = isOwner ? undefined : `/skills/${skill._id}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md">
      <div className={`relative flex h-28 items-center justify-center bg-linear-to-br ${visual.gradient}`}>
        {detailLink ? (
          <Link to={detailLink} className="absolute inset-0" aria-label={skill.skillName} />
        ) : null}
        <span className="text-5xl drop-shadow-sm transition-transform group-hover:scale-110">{emoji}</span>
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge className="bg-white/95 text-gray-800">
            {skill.type === 'teach' ? 'I can teach' : 'I want to learn'}
          </Badge>
          {!skill.isActive && <Badge className="bg-white/95 text-gray-800">Paused</Badge>}
        </div>
        {skill.distanceKm !== undefined && (
          <span className="absolute right-3 top-3 rounded-full bg-black/30 px-2 py-0.5 text-xs font-medium text-white">
            {skill.distanceKm < 1 ? '<1' : skill.distanceKm} km
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate font-semibold text-gray-900">
          {detailLink ? (
            <Link to={detailLink} className="hover:text-indigo-600">
              {skill.skillName}
            </Link>
          ) : (
            skill.skillName
          )}
        </h3>
        <p className={`mt-0.5 text-xs font-medium ${visual.text}`}>{skill.categoryName}</p>

        {skill.description && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">{skill.description}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge color={visual.badge}>{PROFICIENCY_LABELS[skill.proficiencyLevel]}</Badge>
          <Badge color="gray">{FORMAT_LABELS[skill.format]}</Badge>
          <Badge color="gray">{LENGTH_LABELS[skill.sessionLength]}</Badge>
        </div>

        {!isOwner && (
          <div className="mt-3">
            <Rating averageRating={skill.stats.averageRating} reviewCount={skill.stats.reviewCount} />
          </div>
        )}

        <div className="mt-4 border-t border-gray-100 pt-3">
          {isOwner ? (
            (onEdit || onToggle || onDelete) && (
              <div className="flex flex-wrap gap-3">
                {onEdit && (
                  <button type="button" onClick={() => onEdit(skill)} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Edit
                  </button>
                )}
                {onToggle && (
                  <button type="button" onClick={() => onToggle(skill)} className="text-sm font-medium text-gray-600 hover:text-gray-500">
                    {skill.isActive ? 'Pause' : 'Activate'}
                  </button>
                )}
                {onDelete && (
                  <button type="button" onClick={() => onDelete(skill)} className="text-sm font-medium text-red-600 hover:text-red-500">
                    Delete
                  </button>
                )}
              </div>
            )
          ) : skill.teacher ? (
            <div className="flex items-center gap-2">
              <Avatar src={skill.teacher.avatar || undefined} name={skill.teacher.displayName} size="sm" />
              <div className="min-w-0 flex-1">
                <Link
                  to={`/profile/${skill.teacher._id}`}
                  className="block truncate text-sm font-medium text-gray-800 hover:text-indigo-600"
                >
                  {skill.teacher.displayName}
                </Link>
                {skill.teacher.location.city && (
                  <p className="truncate text-xs text-gray-400">{skill.teacher.location.city}</p>
                )}
              </div>
              {hasAvailability && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
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
