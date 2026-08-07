import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import * as adminService from '../../services/admin.service';
import type { ModerationStats } from '../../services/admin.service';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';

const statCards = [
  { label: 'Total users', key: 'totalUsers', color: 'bg-indigo-50 text-indigo-700' },
  { label: 'Total skills', key: 'totalSkills', color: 'bg-purple-50 text-purple-700' },
  { label: 'Total sessions', key: 'totalSessions', color: 'bg-blue-50 text-blue-700' },
  { label: 'Reports this week', key: 'reportsThisWeek', color: 'bg-amber-50 text-amber-700' },
  { label: 'Open reports', key: 'openReports', color: 'bg-red-50 text-red-700' },
  { label: 'Suspended users', key: 'suspendedUsers', color: 'bg-orange-50 text-orange-700' },
  { label: 'Banned users', key: 'bannedUsers', color: 'bg-red-50 text-red-700' },
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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Overview of platform activity and moderation.</p>

      {loading && (
        <div className="py-12 text-center"><Spinner /></div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {stats && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.key}
              className={`rounded-xl border border-gray-200 p-5 ${card.color}`}
            >
              <p className="text-sm font-medium opacity-80">{card.label}</p>
              <p className="mt-2 text-3xl font-bold">{stats[card.key]}</p>
            </div>
          ))}
        </div>
      )}

      {stats && stats.openReports > 0 && (
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            {stats.openReports} open report{stats.openReports === 1 ? '' : 's'} require attention.
          </p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <a
          href="/admin/users"
          className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition"
        >
          <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
          <p className="mt-1 text-sm text-gray-500">View, search, and manage user accounts. Change roles, suspend, or ban users.</p>
        </a>
        <a
          href="/admin/reports"
          className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition"
        >
          <h3 className="text-lg font-semibold text-gray-900">Reports Queue</h3>
          <p className="mt-1 text-sm text-gray-500">Review and resolve user reports. Assign reports to yourself or other moderators.</p>
        </a>
      </div>
    </div>
  );
}
