import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOutbox, withdrawRequest } from '../../services/connections';
import { getApiError } from '../../types/api.types';
import type { Connection } from '../../types/connection.types';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  pending: 'amber',
  accepted: 'green',
  rejected: 'red',
  completed: 'blue',
  withdrawn: 'gray',
  cancelled: 'gray',
};

export default function OutboxPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getOutbox(page);
      setConnections(result.connections);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleWithdraw(id: string) {
    if (!window.confirm('Withdraw this request?')) return;
    setActionId(id);
    try {
      await withdrawRequest(id);
      toast.success('Request withdrawn');
      load();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setActionId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiSend />}
        title="Sent Requests"
        subtitle="Session requests you've sent."
        actions={<Link to="/inbox" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">View inbox</Link>}
      />

      {connections.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiSend />}
          title="No sent requests"
          description="When you request a session with someone, it will show up here."
        />
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {connections.map((conn) => {
            const teacher = typeof conn.teacherId === 'object' ? conn.teacherId : null;
            const skill = typeof conn.skillId === 'object' ? conn.skillId : null;
            return (
              <div
                key={conn._id}
                className="card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={teacher?.avatar || undefined}
                      name={teacher?.displayName || 'Teacher'}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <Link
                        to={`/profile/${teacher?._id || ''}`}
                        className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600"
                      >
                        {teacher?.displayName || 'Unknown'}
                      </Link>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {skill?.skillName || 'Skill'} {skill?.categoryName ? `(${skill.categoryName})` : ''}
                      </p>
                    </div>
                  </div>
                  <Badge color={STATUS_COLORS[conn.status] as 'amber' | 'green' | 'red' | 'blue' | 'gray'}>
                    {conn.status}
                  </Badge>
                </div>

                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{conn.message}</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Format: {conn.proposedFormat} · {new Date(conn.createdAt).toLocaleDateString()}
                </p>

                {conn.responseMessage && (
                  <p className="mt-2 rounded-md bg-gray-50 dark:bg-gray-900 p-2 text-xs text-gray-600 dark:text-gray-400">
                    Response: {conn.responseMessage}
                  </p>
                )}

                {conn.status === 'pending' && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="danger"
                      loading={actionId === conn._id}
                      onClick={() => handleWithdraw(conn._id)}
                    >
                      Withdraw
                    </Button>
                  </div>
                )}

                {conn.status === 'accepted' && (
                  <div className="mt-3 flex gap-2">
                    <Link to={`/chat/${conn._id}`}>
                      <Button size="sm">Open chat</Button>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="self-center text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
