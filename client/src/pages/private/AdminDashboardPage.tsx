import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as adminService from '../../services/admin.service';
import type { ModerationStats } from '../../services/admin.service';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/ui/PageHeader';
import { FiShield } from 'react-icons/fi';

const statCards = [
  { label: 'Total users', key: 'totalUsers', color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' },
  { label: 'Total skills', key: 'totalSkills', color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' },
  { label: 'Total sessions', key: 'totalSessions', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' },
  { label: 'Reports this week', key: 'reportsThisWeek', color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' },
  { label: 'Open reports', key: 'openReports', color: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400' },
  { label: 'Suspended users', key: 'suspendedUsers', color: 'bg-orange-50 text-orange-700' },
  { label: 'Banned users', key: 'bannedUsers', color: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400' },
] as const;

export default function AdminDashboardPage() {
  const { user: me, status } = useAuth();
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isModerator = me && (me.role === 'admin' || me.role === 'moderator');

  useEffect(() => {
    if (!isModerator) return;
    loadStats();
  }, [isModerator]);

  async function loadStats() {
    try {
      const data = await adminService.getModerationStats();
      setStats(data);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') return <Spinner />;
  if (!isModerator) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiShield />}
        title="Admin Dashboard"
        subtitle="Overview of platform activity and moderation."
      />

      {loading && (
        <div className="py-12 text-center"><Spinner /></div>
      )}

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {stats && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.key}
              className={`rounded-xl border border-gray-200 dark:border-gray-700 p-5 ${card.color}`}
            >
              <p className="text-sm font-medium opacity-80">{card.label}</p>
              <p className="mt-2 text-3xl font-bold">{stats[card.key]}</p>
            </div>
          ))}
        </div>
      )}

      {stats && stats.openReports > 0 && (
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/40 p-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {stats.openReports} open report{stats.openReports === 1 ? '' : 's'} require attention.
          </p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <a
          href="/admin/users"
          className="card card-hover block p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">User Management</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">View, search, and manage user accounts. Change roles, suspend, or ban users.</p>
        </a>
        <a
          href="/admin/reports"
          className="card card-hover block p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reports Queue</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Review and resolve user reports. Assign reports to yourself or other moderators.</p>
        </a>
      </div>
    </div>
  );
}
