import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOutbox, withdrawRequest } from '../../services/connections';
import { getApiError } from '../../types/api.types';
import type { Connection } from '../../types/connection.types';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
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
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={load}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sent Requests</h1>
        <Link to="/inbox" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          View inbox
        </Link>
      </div>

      {connections.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          You haven't sent any requests yet.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {connections.map((conn) => {
            const teacher = typeof conn.teacherId === 'object' ? conn.teacherId : null;
            const skill = typeof conn.skillId === 'object' ? conn.skillId : null;
            return (
              <div
                key={conn._id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={teacher?.avatar || undefined}
                      name={teacher?.displayName || 'Teacher'}
                      size="sm"
                    />
                    <div>
                      <Link
                        to={`/profile/${teacher?._id || ''}`}
                        className="text-sm font-semibold text-gray-900 hover:text-indigo-600"
                      >
                        {teacher?.displayName || 'Unknown'}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {skill?.skillName || 'Skill'} {skill?.categoryName ? `(${skill.categoryName})` : ''}
                      </p>
                    </div>
                  </div>
                  <Badge color={STATUS_COLORS[conn.status] as 'amber' | 'green' | 'red' | 'blue' | 'gray'}>
                    {conn.status}
                  </Badge>
                </div>

                <p className="mt-3 text-sm text-gray-600">{conn.message}</p>
                <p className="mt-1 text-xs text-gray-400">
                  Format: {conn.proposedFormat} · {new Date(conn.createdAt).toLocaleDateString()}
                </p>

                {conn.responseMessage && (
                  <p className="mt-2 rounded-md bg-gray-50 p-2 text-xs text-gray-600">
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
          <span className="self-center text-sm text-gray-500">
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
