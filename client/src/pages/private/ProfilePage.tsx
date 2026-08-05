import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserById } from '../../services/users.service';
import { listSkills } from '../../services/skills';
import { getApiError } from '../../types/api.types';
import type { User } from '../../types/user.types';
import type { SkillWithTeacher } from '../../types/skill.types';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ReportForm from '../../components/forms/ReportForm';
import { getSkillEmoji } from '../../data/skillVisuals';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [teachSkills, setTeachSkills] = useState<SkillWithTeacher[]>([]);
  const [learnSkills, setLearnSkills] = useState<SkillWithTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      if (!id || (me && id === me._id)) {
        if (!cancelled) setProfile(me ?? null);
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const result = await getUserById(id);
        if (!cancelled) setProfile(result);
        const [teach, learn] = await Promise.all([
          listSkills({ userId: id, type: 'teach', limit: 12 }),
          listSkills({ userId: id, type: 'learn', limit: 12 }),
        ]);
        if (!cancelled) {
          setTeachSkills(teach.skills);
          setLearnSkills(learn.skills);
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
  }, [id, me]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Profile not found</h1>
        <p className="mt-2 text-sm text-gray-600">{error || 'This user does not exist.'}</p>
        <Link to="/" className="mt-6 inline-block">
          <Button variant="secondary">Back to home</Button>
        </Link>
      </div>
    );
  }

  const isSelf = me?._id === profile._id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-start gap-5">
        <Avatar src={profile.avatar || undefined} name={profile.displayName} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{profile.displayName}</h1>
            {isSelf && (
              <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                You
              </span>
            )}
          </div>
          {isSelf && <p className="mt-1 text-sm text-gray-500">{profile.email}</p>}
          {profile.bio && <p className="mt-3 text-gray-700">{profile.bio}</p>}
        </div>
        {isSelf && (
          <Link to="/edit-profile">
            <Button variant="secondary" size="sm">
              Edit profile
            </Button>
          </Link>
        )}
        {!isSelf && me && (
          <Button variant="secondary" size="sm" onClick={() => setShowReport(true)}>
            Report user
          </Button>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-gray-900">
            {profile.stats.sessionsCompleted}
          </p>
          <p className="text-sm text-gray-500">Sessions completed</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-gray-900">
            {profile.stats.averageRating.toFixed(1)}
          </p>
          <p className="text-sm text-gray-500">Average rating</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-gray-900">{profile.stats.reviewCount}</p>
          <p className="text-sm text-gray-500">Reviews</p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900">Member since</h2>
        <p className="mt-1 text-sm text-gray-600">
          {new Date(profile.createdAt).toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {profile.location.city && (
        <div className="mt-8 rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900">Location</h2>
          <p className="mt-1 text-sm text-gray-600">
            {[profile.location.city, profile.location.neighborhood]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      )}

      {profile.availability.length > 0 && (
        <div className="mt-8 rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900">Availability</h2>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            {profile.availability.map((slot, index) => (
              <li key={`${slot.day}-${index}`}>
                <span className="font-medium capitalize">{slot.day}</span>: {slot.startTime}–
                {slot.endTime}
              </li>
            ))}
          </ul>
        </div>
      )}

      <SkillListBlock title="I can teach" skills={teachSkills} empty="Nothing listed yet." />
      <SkillListBlock title="I want to learn" skills={learnSkills} empty="Nothing listed yet." />

      {!isSelf && me && (
        <ReportForm
          open={showReport}
          onClose={() => setShowReport(false)}
          targetType="user"
          targetId={profile._id}
          targetName={profile.displayName}
        />
      )}
    </div>
  );
}

function SkillListBlock({
  title,
  skills,
  empty,
}: {
  title: string;
  skills: SkillWithTeacher[];
  empty: string;
}) {
  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {skills.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">{empty}</p>
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {skills.map((skill) => (
            <li key={skill._id}>
              <Link
                to={`/skills/${skill._id}`}
                className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 hover:border-indigo-300 hover:bg-indigo-50/40"
              >
                <span className="text-lg" aria-hidden="true">
                  {getSkillEmoji(skill.categoryName, skill.skillName)}
                </span>
                <span className="truncate text-sm font-medium text-gray-800">{skill.skillName}</span>
                <span className="ml-auto shrink-0">
                  <Badge>{skill.categoryName}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
