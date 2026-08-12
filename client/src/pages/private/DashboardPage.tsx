import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAward,
  FiBarChart2,
  FiBookOpen,
  FiEdit3,
  FiGrid,
  FiHome,
  FiMap,
  FiStar,
  FiTrendingUp,
  FiUsers,
  FiUser,
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { getSubscriptionStatus } from '../../services/billing.service';
import type { SubscriptionStatus } from '../../types/billing.types';
import Button from '../../components/ui/Button';
import StatCard from '../../components/ui/StatCard';
import PageHeader from '../../components/ui/PageHeader';
import ProBadge from '../../components/shared/ProBadge';
import ProfileCompletenessBar from '../../components/social/ProfileCompletenessBar';

const QUICK_ACTIONS = [
  { label: 'Browse skills', to: '/skills', icon: <FiGrid />, tone: 'from-sky-500 to-blue-600', text: 'Find something new to learn' },
  { label: 'Skill map', to: '/map', icon: <FiMap />, tone: 'from-emerald-500 to-teal-600', text: 'See who’s nearby' },
  { label: 'My skills', to: '/my-skills', icon: <FiAward />, tone: 'from-indigo-500 to-violet-600', text: 'Manage what you teach' },
  { label: 'Community feed', to: '/feed', icon: <FiHome />, tone: 'from-amber-500 to-orange-600', text: 'See what’s happening' },
  { label: 'Inbox', to: '/inbox', icon: <FiUsers />, tone: 'from-rose-500 to-pink-600', text: 'Session requests' },
  { label: 'My journey', to: '/gamification', icon: <FiTrendingUp />, tone: 'from-violet-500 to-fuchsia-600', text: 'XP, levels & streaks' },
  { label: 'Journal', to: '/journal', icon: <FiBookOpen />, tone: 'from-amber-500 to-yellow-600', text: 'Reflect on sessions' },
  { label: 'My impact', to: '/impact', icon: <FiBarChart2 />, tone: 'from-emerald-500 to-green-600', text: 'See the good you’ve done' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    getSubscriptionStatus().then(setSubscription).catch(() => {});
  }, []);

  if (!user) return null;

  const stats = [
    { label: 'Sessions completed', value: user.stats.sessionsCompleted, tone: 'indigo' as const, icon: <FiAward /> },
    { label: 'Average rating', value: user.stats.averageRating.toFixed(1), tone: 'amber' as const, icon: <FiStar /> },
    { label: 'Reviews', value: user.stats.reviewCount, tone: 'emerald' as const, icon: <FiUsers /> },
  ];

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiHome />}
        title={
          <span className="flex items-center gap-2">
            {user.displayName}
            {subscription?.isPro && <ProBadge size="sm" />}
          </span>
        }
        subtitle={
          <>
            {user.email} · Member since {new Date(user.createdAt).toLocaleDateString()}
          </>
        }
        actions={
          <>
            <Link to="/profile">
              <Button variant="secondary">
                <FiUser className="mr-1.5 h-4 w-4" /> View profile
              </Button>
            </Link>
            <Link to="/edit-profile">
              <Button variant="secondary">
                <FiEdit3 className="mr-1.5 h-4 w-4" /> Edit profile
              </Button>
            </Link>
          </>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={
            user.isEmailVerified
              ? 'inline-flex rounded-full bg-green-100 px-2.5 py-0.5 font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300'
              : 'inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
          }
        >
          {user.isEmailVerified ? 'Email verified' : 'Email not verified'}
        </span>
        {user.isIdVerified && (
          <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 font-medium text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
            ID verified
          </span>
        )}
      </div>

      {user.bio && (
        <p className="mt-4 max-w-2xl text-gray-700 dark:text-gray-300">{user.bio}</p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} tone={stat.tone} hint="lifetime" />
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">Quick actions</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action, index) => (
            <Link
              key={action.to}
              to={action.to}
              className="card card-hover group animate-fade-in-up p-5"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-soft ${action.tone}`}>
                {action.icon}
              </div>
              <p className="mt-3 font-medium text-gray-900 dark:text-gray-100">{action.label}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{action.text}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-gray-100">
            <FiTrendingUp className="h-4 w-4 text-indigo-500" />
            Today at a glance
          </h2>
          <div className="mt-4 space-y-4 text-sm">
            {subscription?.isPro ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Pro member</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Active until {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'renewal'}
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  Pro ✦
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Upgrade to Pro</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Unlock advanced features & support the Hearth.</p>
                </div>
                <Link to="/upgrade">
                  <Button variant="ghost" size="sm">Upgrade</Button>
                </Link>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Keep your logging streak alive</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Write a journal entry today.</p>
              </div>
              <Link to="/journal">
                <Button variant="secondary" size="sm">Journal</Button>
              </Link>
            </div>
            {user.location.city && (
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                <p className="mt-0.5 font-medium text-gray-900 dark:text-gray-100">
                  {[user.location.city, user.location.neighborhood].filter(Boolean).join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Profile</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            A complete profile helps neighbours find you.
          </p>
          <div className="mt-4">
            <ProfileCompletenessBar />
          </div>
        </div>
      </div>
    </div>
  );
}
