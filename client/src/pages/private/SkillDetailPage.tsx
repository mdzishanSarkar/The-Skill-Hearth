import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { deleteSkill, getSkill, toggleSkill } from '../../services/skills';
import { getSkillReviews } from '../../services/reviews';
import { getApiError } from '../../types/api.types';
import type { Review } from '../../types/review.types';
import type { SkillWithTeacher } from '../../types/skill.types';
import {
  FORMAT_LABELS,
  LENGTH_LABELS,
  PROFICIENCY_LABELS,
} from '../../types/skill.types';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ReviewCard from '../../components/shared/ReviewCard';
import { getCategoryVisual, getSkillEmoji } from '../../data/skillVisuals';

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const [skill, setSkill] = useState<SkillWithTeacher | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const [skillResult, reviewsResult] = await Promise.all([
          getSkill(id),
          getSkillReviews(id),
        ]);
        if (!cancelled) {
          setSkill(skillResult);
          setReviews(reviewsResult);
        }
      } catch (err) {
        if (!cancelled) setError(getApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Skill not found</h1>
        <p className="mt-2 text-sm text-gray-600">{error || 'This skill does not exist.'}</p>
        <Link to="/skills" className="mt-6 inline-block">
          <Button variant="secondary">Browse skills</Button>
        </Link>
      </div>
    );
  }

  const current = skill;
  const isOwner = me?._id === current.userId;

  async function handleToggle() {
    try {
      await toggleSkill(current._id, !current.isActive);
      toast.success(current.isActive ? 'Skill paused' : 'Skill activated');
      setSkill({ ...current, isActive: !current.isActive });
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${current.skillName}"?`)) return;
    try {
      await deleteSkill(current._id);
      toast.success('Skill deleted');
      setSkill(null);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className={`relative flex h-36 items-center justify-center bg-linear-to-br ${getCategoryVisual(current.categoryName).gradient}`}>
          <span className="text-6xl drop-shadow-sm">{getSkillEmoji(current.categoryName, current.skillName)}</span>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge color={current.type === 'teach' ? 'indigo' : 'green'}>
              {current.type === 'teach' ? 'I can teach' : 'I want to learn'}
            </Badge>
            <Badge color={getCategoryVisual(current.categoryName).badge}>{current.categoryName}</Badge>
            {!current.isActive && <Badge color="gray">Paused</Badge>}
          </div>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">{current.skillName}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge color={getCategoryVisual(current.categoryName).badge}>
              {PROFICIENCY_LABELS[current.proficiencyLevel]}
            </Badge>
            <Badge color="gray">{FORMAT_LABELS[current.format]}</Badge>
            <Badge color="gray">{LENGTH_LABELS[current.sessionLength]}</Badge>
          </div>
          {current.description && <p className="mt-4 text-gray-700">{current.description}</p>}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-5">
            {isOwner ? (
              <div className="flex flex-wrap gap-3">
                <Link to="/my-skills">
                  <Button variant="secondary" size="sm">Manage my skills</Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={handleToggle}>
                  {current.isActive ? 'Pause' : 'Activate'}
                </Button>
                <Button variant="danger" size="sm" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            ) : (
              <Button
                onClick={() =>
                  toast('Session requests arrive with the Connections module.', {
                    icon: '🔗',
                  })
                }
              >
                Request a Session
              </Button>
            )}
          </div>
        </div>
      </div>

      {!isOwner && skill.teacher && (
        <div className="mt-6 rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900">About the teacher</h2>
          <div className="mt-3 flex items-center gap-4">
            <Avatar src={skill.teacher.avatar || undefined} name={skill.teacher.displayName} size="lg" />
            <div className="min-w-0 flex-1">
              <Link
                to={`/profile/${skill.teacher._id}`}
                className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
              >
                {skill.teacher.displayName}
              </Link>
              <p className="text-sm text-gray-500">
                {skill.teacher.stats.reviewCount > 0
                  ? `${skill.teacher.stats.averageRating.toFixed(1)} rating · ${skill.teacher.stats.reviewCount} reviews`
                  : 'No reviews yet'}
              </p>
              {skill.teacher.bio && <p className="mt-2 text-sm text-gray-600">{skill.teacher.bio}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Reviews for this skill
          {reviews.length > 0 && <span className="ml-2 text-sm font-normal text-gray-500">({reviews.length})</span>}
        </h2>
        {reviews.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            No reviews for this skill yet.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {reviews.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
