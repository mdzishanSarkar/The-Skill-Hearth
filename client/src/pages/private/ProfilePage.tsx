import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserById } from '../../services/users.service';
import { listSkills } from '../../services/skills';
import { getGamificationProfile, getPublicGamification } from '../../services/gamification.service';
import { getApiError } from '../../types/api.types';
import type { User } from '../../types/user.types';
import type { SkillWithTeacher } from '../../types/skill.types';
import type { GamificationProfileResult, PublicGamification } from '../../types/gamification.types';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import StatCard from '../../components/ui/StatCard';
import { FiAward, FiStar, FiUsers } from 'react-icons/fi';
import ReportForm from '../../components/forms/ReportForm';
import BlockButton from '../../components/social/BlockButton';
import { getSkillEmoji } from '../../data/skillVisuals';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [gamification, setGamification] = useState<GamificationProfileResult | PublicGamification | null>(null);
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
        try {
          const journey = await getGamificationProfile();
          if (!cancelled) setGamification(journey);
        } catch {
          // Journey stats are optional; profile still renders without them.
        }
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const result = await getUserById(id);
        if (!cancelled) setProfile(result);
        const [teach, learn, journey] = await Promise.all([
          listSkills({ userId: id, type: 'teach', limit: 12 }),
          listSkills({ userId: id, type: 'learn', limit: 12 }),
          getPublicGamification(id),
        ]);
        if (!cancelled) {
          setTeachSkills(teach.skills);
          setLearnSkills(learn.skills);
          setGamification(journey);
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
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Profile not found</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{error || 'This user does not exist.'}</p>
        <Link to="/" className="mt-6 inline-block">
          <Button variant="secondary">Back to home</Button>
        </Link>
      </div>
    );
  }

  const isSelf = me?._id === profile._id;

  return (
    <div className="page-shell animate-fade-in py-8">
      <div className="card flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:items-start sm:text-left">
        <Avatar src={profile.avatar || undefined} name={profile.displayName} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profile.displayName}</h1>
            {isSelf && (
              <span className="inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                You
              </span>
            )}
          </div>
          {isSelf && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>}
          {profile.bio && <p className="mt-3 text-gray-700 dark:text-gray-300">{profile.bio}</p>}
        </div>
        {isSelf && (
          <Link to="/edit-profile">
            <Button variant="secondary" size="sm">
              Edit profile
            </Button>
          </Link>
        )}
        {!isSelf && me && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <BlockButton targetUserId={profile._id} />
            <Button variant="secondary" size="sm" onClick={() => setShowReport(true)}>
              Report user
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<FiAward />} label="Sessions completed" value={profile.stats.sessionsCompleted} tone="indigo" />
        <StatCard icon={<FiStar />} label="Average rating" value={profile.stats.averageRating.toFixed(1)} tone="amber" />
        <StatCard icon={<FiUsers />} label="Reviews" value={profile.stats.reviewCount} tone="emerald" />
      </div>

      {gamification && (
        <div className="card mt-6 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Journey</h2>
            {isSelf && (
              <Link to="/gamification" className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                View details
              </Link>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xl" aria-hidden="true">{gamification.level.icon}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Level {gamification.level.level}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{gamification.level.name}</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{gamification.xp} XP</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Experience</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {'streaks' in gamification
                  ? `${Math.max(0, ...gamification.streaks.map((s) => s.currentStreak))} 🔥`
                  : gamification.friendCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {'streaks' in gamification ? 'Day streak' : 'Friends'}
              </p>
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {'earnedBadgeIds' in gamification ? gamification.earnedBadgeIds.length : gamification.badges.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Badges</p>
            </div>
          </div>
        </div>
      )}

      <div className="card mt-6 p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Member since</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {new Date(profile.createdAt).toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>

      {profile.location.city && (
        <div className="card mt-6 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Location</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {[profile.location.city, profile.location.neighborhood]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      )}

      {profile.availability.length > 0 && (
        <div className="card mt-6 p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Availability</h2>
          <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
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
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {skills.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{empty}</p>
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {skills.map((skill) => (
            <li key={skill._id}>
              <Link
                to={`/skills/${skill._id}`}
                className="flex items-center gap-2 rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
              >
                <span className="text-lg" aria-hidden="true">
                  {getSkillEmoji(skill.categoryName, skill.skillName)}
                </span>
                <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{skill.skillName}</span>
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
