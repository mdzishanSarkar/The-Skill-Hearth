import { useState, useEffect } from 'react';
import { FiPlus, FiFilter, FiUsers, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { listSessions } from '../../services/groupSession.service';
import { listMySkills } from '../../services/skills';
import { useAuth } from '../../hooks/useAuth';
import GroupSessionCard from '../../components/community/GroupSessionCard';
import CreateGroupSessionModal from '../../components/community/CreateGroupSessionModal';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { showError } from '../../utils/toast';
import { getApiError } from '../../types/api.types';
import type { GroupSession } from '../../types/groupSession.types';
import type { SkillWithTeacher } from '../../types/skill.types';

export default function GroupSessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<'new' | 'scheduled'>('new');
  const [statusFilter, setStatusFilter] = useState('open');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [mySkills, setMySkills] = useState<SkillWithTeacher[]>([]);

  const city = user?.location?.city || 'dhaka';

  useEffect(() => {
    if (user) {
      listMySkills({ type: 'teach', limit: 50 })
        .then((result) => setMySkills(result.skills))
        .catch(() => setMySkills([]));
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listSessions({
      city,
      category: categoryFilter || undefined,
      status: statusFilter || undefined,
      sort,
      page,
    })
      .then((result) => {
        if (cancelled) return;
        setSessions(result.sessions);
        setTotalPages(result.totalPages);
      })
      .catch((err) => {
        if (!cancelled) showError(getApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [city, categoryFilter, statusFilter, sort, page, version]);

  function handleSessionCreated() {
    setPage(1);
    setVersion((v) => v + 1);
  }

  const goToPage = (next: number) => {
    if (next < 1 || next > totalPages || next === page) return;
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

      {loading && sessions.length === 0 ? (
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
        <>
          {loading && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-xs font-medium text-indigo-600 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300">
              <Spinner size="sm" />
              Loading page {page}…
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sessions.map((session) => (
              <GroupSessionCard key={session._id} session={session} />
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <nav aria-label="Sessions pagination" className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <FiChevronLeft className="mr-1 h-4 w-4" /> Previous
          </button>
          <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">
            Page <span className="font-semibold text-gray-900 dark:text-gray-100">{page}</span> of {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Next <FiChevronRight className="ml-1 h-4 w-4" />
          </button>
        </nav>
      )}

      <CreateGroupSessionModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleSessionCreated}
        skills={mySkills.map((s) => ({ _id: s._id, skillName: s.skillName, categoryName: s.categoryName }))}
      />
    </div>
  );
}
