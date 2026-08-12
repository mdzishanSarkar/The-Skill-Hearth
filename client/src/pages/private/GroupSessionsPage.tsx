import { useState, useEffect } from 'react';
import { FiPlus, FiFilter, FiUsers } from 'react-icons/fi';
import { listSessions } from '../../services/groupSession.service';
import { useAuth } from '../../hooks/useAuth';
import GroupSessionCard from '../../components/community/GroupSessionCard';
import CreateGroupSessionModal from '../../components/community/CreateGroupSessionModal';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import type { GroupSession } from '../../types/groupSession.types';

export default function GroupSessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<'new' | 'scheduled'>('new');
  const [statusFilter, setStatusFilter] = useState('open');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const city = user?.location?.city || 'london';

  async function fetchSessions() {
    setLoading(true);
    try {
      const result = await listSessions({
        city,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        sort,
        page,
      });
      setSessions(result.sessions);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to load sessions', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, [city, categoryFilter, statusFilter, sort, page]);

  function handleSessionCreated() {
    setPage(1);
    fetchSessions();
  }

  const categories = [
    'Food & Cooking',
    'Home & Garden',
    'Textile & Craft',
    'Digital Literacy',
    'Languages & Communication',
  ];

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiUsers />}
        title="Group Sessions"
        subtitle="Join group learning sessions in your neighborhood"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter className="h-4 w-4" />
              Filters
            </Button>
            {user && (
              <Button onClick={() => setShowCreate(true)}>
                <FiPlus className="h-4 w-4" />
                Create Session
              </Button>
            )}
          </div>
        }
      />

      {showFilters && (
        <div className="mb-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="full">Full</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort</label>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="new">Newest</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<FiUsers />}
          title="No group sessions found"
          description="No group sessions found. Be the first to organize one."
          action={
            user ? (
              <Button variant="secondary" size="sm" onClick={() => setShowCreate(true)}>
                Create the first session
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sessions.map((session) => (
            <GroupSessionCard key={session._id} session={session} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      <CreateGroupSessionModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleSessionCreated}
        skills={[]}
      />
    </div>
  );
}
