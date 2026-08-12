import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import * as adminService from '../../services/admin.service';
import { getApiError } from '../../types/api.types';
import type { User } from '../../types/user.types';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/ui/PageHeader';
import { FiUsers } from 'react-icons/fi';

const ROLES = ['user', 'moderator', 'admin'] as const;
const STATUSES = ['active', 'suspended', 'banned'] as const;

const statusBadge: Record<string, string> = {
  active: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
  suspended: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
  banned: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
};

export default function AdminUsersPage() {
  const { user: me, status } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedSearch(search);
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const result = await adminService.listUsers({
          page,
          limit: 20,
          search: appliedSearch,
          role: roleFilter,
          status: statusFilter,
        });
        if (cancelled) return;
        setUsers(result.users);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch (err) {
        if (cancelled) return;
        setError(getApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page, appliedSearch, roleFilter, statusFilter]);

  async function changeRole(id: string, role: string) {
    setBusyId(id);
    try {
      await adminService.updateUserRole(id, role);
      toast.success('Role updated');
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role: role as User['role'] } : u))
      );
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setBusyId('');
    }
  }

  async function changeStatus(id: string, newStatus: string) {
    setBusyId(id);
    try {
      await adminService.updateUserStatus(id, newStatus);
      toast.success(`User ${newStatus}`);
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, status: newStatus as User['status'] } : u))
      );
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setBusyId('');
    }
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }
  if (me?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiUsers />}
        title="User management"
        subtitle={`${total} registered users`}
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="w-64">
          <Input
            id="admin-search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
        >
          <option value="">All roles</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
        >
          <option value="">All statuses</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">No users found.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar || undefined} name={u.displayName} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{u.displayName}</p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={busyId === u._id}
                      onChange={(e) => changeRole(u._id, e.target.value)}
                      className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none disabled:opacity-50"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[u.status]}`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {u.isEmailVerified ? 'Yes' : 'No'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {u.status !== 'active' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busyId === u._id}
                          onClick={() => changeStatus(u._id, 'active')}
                        >
                          Activate
                        </Button>
                      )}
                      {u.status === 'active' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={busyId === u._id}
                            onClick={() => changeStatus(u._id, 'suspended')}
                          >
                            Suspend
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={busyId === u._id}
                            onClick={() => changeStatus(u._id, 'banned')}
                          >
                            Ban
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
