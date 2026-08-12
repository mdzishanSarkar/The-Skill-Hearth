import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getGamificationProfile,
  getLeaderboard,
  getFriendsStreaks,
  freezeStreak,
} from '../../services/gamification.service';
import type {
  GamificationProfileResult,
  LeaderboardResult,
  FriendsStreakEntry,
} from '../../types/gamification.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/ui/PageHeader';
import { FiTrendingUp } from 'react-icons/fi';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';

export default function GamificationPage() {
  const [profile, setProfile] = useState<GamificationProfileResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResult | null>(null);
  const [friendsStreaks, setFriendsStreaks] = useState<FriendsStreakEntry[]>([]);
  const [scope, setScope] = useState<'local' | 'global'>('local');
  const [loading, setLoading] = useState(true);
  const [freezing, setFreezing] = useState('');

  useEffect(() => {
    Promise.all([getGamificationProfile(), getFriendsStreaks(), getLeaderboard(scope)])
      .then(([p, fs, lb]) => {
        setProfile(p);
        setFriendsStreaks(fs);
        setLeaderboard(lb);
      })
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoading(false));
  }, [scope]);

  async function handleFreeze(type: string) {
    setFreezing(type);
    try {
      await freezeStreak(type as 'teaching' | 'learning' | 'logging');
      toast.success('Streak frozen for 24 hours 🔥');
      const p = await getGamificationProfile();
      setProfile(p);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setFreezing('');
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const streakTypes: Array<{ key: 'teaching' | 'learning' | 'logging'; label: string; emoji: string }> = [
    { key: 'teaching', label: 'Teaching', emoji: '🧑‍🏫' },
    { key: 'learning', label: 'Learning', emoji: '📚' },
    { key: 'logging', label: 'Logging', emoji: '✍️' },
  ];

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiTrendingUp />}
        title="Your Journey"
        subtitle="Earn XP and badges by sharing skills, learning, and staying consistent."
      />

      <div className="card mt-6 p-6">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{profile.level.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Level {profile.level.level}: {profile.level.name}
              </h2>
              <Badge color="indigo">{profile.xp} XP</Badge>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                style={{ width: `${profile.progressToNextLevel}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {profile.nextLevel
                ? `${profile.progressToNextLevel}% to Level ${profile.nextLevel.level}: ${profile.nextLevel.name} (${profile.nextLevel.xpRequired} XP)`
                : 'Max level reached — legendary!'}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{profile.friendCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Friends</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{profile.stats.sessionsCompleted}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sessions</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{profile.stats.reviewCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Reviews</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Referral code: <span className="font-mono text-gray-600 dark:text-gray-400">{profile.referralCode || '—'}</span>
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Streaks</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Keep the flame alive — miss a day and your streak resets. Use a freeze to protect it.
          </p>
          <div className="mt-4 space-y-3">
            {streakTypes.map(({ key, label, emoji }) => {
              const streak = profile.streaks.find((s) => s.type === key);
              return (
                <div key={key} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {streak ? `${streak.currentStreak} day${streak.currentStreak === 1 ? '' : 's'} · longest ${streak.longestStreak}` : 'No streak yet'}
                      </p>
                    </div>
                  </div>
                  {streak?.atRisk ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={freezing === key}
                      disabled={(streak.freezesAvailable ?? 0) <= 0}
                      onClick={() => handleFreeze(key)}
                    >
                      ❄️ Freeze{streak.freezesAvailable > 0 ? ` (${streak.freezesAvailable})` : ''}
                    </Button>
                  ) : (
                    <Badge color={streak?.atRisk ? 'red' : streak && streak.currentStreak >= 7 ? 'green' : 'gray'}>
                      {streak?.atRisk ? 'At risk' : streak && streak.currentStreak >= 7 ? 'On fire 🔥' : streak?.currentStreak ? 'Active' : '—'}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
          {friendsStreaks.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Friends on fire</p>
              <div className="mt-2 space-y-1">
                {friendsStreaks.map((entry) => (
                  <Link key={`${entry.userId}-${entry.type}`} to={`/profile/${entry.userId}`} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Avatar src={entry.avatar || undefined} name={entry.displayName} size="sm" />
                    <span className="flex-1 truncate text-xs text-gray-700 dark:text-gray-300">{entry.displayName}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{entry.type}</span>
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">🔥 {entry.currentStreak}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="card p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Badges</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {profile.earnedBadgeIds.length} of {profile.badges.length} earned.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {profile.badges.map((badge) => (
              <div
                key={badge.id}
                className={`rounded-lg border p-3 ${badge.earned ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/40' : 'border-gray-100 bg-gray-50 dark:bg-gray-900 opacity-50'}`}
                title={badge.description}
              >
                <p className="text-xl">{badge.emoji}</p>
                <p className={`text-xs font-semibold ${badge.earned ? 'text-amber-800 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  {badge.name}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{badge.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card mt-6 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Leaderboard</h3>
          <div className="flex gap-1">
            {(['local', 'global'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize ${
                  scope === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {leaderboard && (
          <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
            {leaderboard.entries.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">No ranked players yet.</p>
            ) : (
              leaderboard.entries.slice(0, 10).map((entry, index) => (
                <li key={entry._id} className="flex items-center gap-3 py-2">
                  <span className="w-6 text-center text-sm font-bold text-gray-400 dark:text-gray-500">
                    {index + 1}
                  </span>
                  <Link to={`/profile/${entry._id}`}>
                    <Avatar src={entry.avatar || undefined} name={entry.displayName} size="sm" />
                  </Link>
                  <Link to={`/profile/${entry._id}`} className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600">
                    {entry.displayName}
                  </Link>
                  <Badge color="gray">Lv {entry.level}</Badge>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{entry.xp} XP</span>
                </li>
              ))
            )}
            {leaderboard.myRank !== null && leaderboard.myRank > 10 && (
              <li className="flex items-center gap-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="w-6 text-center font-bold">…</span>
                <span>You are ranked #{leaderboard.myRank}</span>
              </li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
