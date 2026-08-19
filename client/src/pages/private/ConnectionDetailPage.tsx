import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getConnection,
  respondToRequest,
  cancelConnection,
  markCompleted,
} from '../../services/connections';
import { getMyConnectionReview } from '../../services/reviews';
import { listConnectionEntries } from '../../services/journal.service';
import { getApiError } from '../../types/api.types';
import type { Connection } from '../../types/connection.types';
import type { Review } from '../../types/review.types';
import type { JournalEntry } from '../../types/journal.types';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ReviewFormModal from '../../components/forms/ReviewFormModal';
import EndorsementButton from '../../components/social/EndorsementButton';
import JournalEntryFormModal from '../../components/forms/JournalEntryFormModal';
import { moodEmoji } from '../../utils/journal';

const STATUS_COLORS: Record<string, string> = {
  pending: 'amber',
  accepted: 'green',
  rejected: 'red',
  completed: 'blue',
  withdrawn: 'gray',
  cancelled: 'gray',
};

export default function ConnectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [showJournal, setShowJournal] = useState(false);

  useEffect(() => {
    if (connection?.status === 'completed') {
      listConnectionEntries(connection._id)
        .then(setJournalEntries)
        .catch(() => setJournalEntries([]));
    } else {
      setJournalEntries([]);
    }
  }, [connection?._id, connection?.status]);

  useEffect(() => {
    if (connection?.status !== 'completed') {
      setExistingReview(null);
      return;
    }
    getMyConnectionReview(connection._id)
      .then(setExistingReview)
      .catch(() => setExistingReview(null));
  }, [connection?._id, connection?.status]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getConnection(id)
      .then(setConnection)
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAccept() {
    if (!connection) return;
    setActionLoading(true);
    try {
      await respondToRequest(connection._id, 'accepted');
      toast.success('Request accepted!');
      setConnection({ ...connection, status: 'accepted' });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!connection) return;
    setActionLoading(true);
    try {
      await respondToRequest(connection._id, 'rejected');
      toast.success('Request declined');
      setConnection({ ...connection, status: 'rejected' });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!connection || !window.confirm('Cancel this connection?')) return;
    setActionLoading(true);
    try {
      await cancelConnection(connection._id);
      toast.success('Connection cancelled');
      setConnection({ ...connection, status: 'cancelled' });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleComplete() {
    if (!connection || !window.confirm('Mark this session as completed?')) return;
    setActionLoading(true);
    try {
      await markCompleted(connection._id);
      toast.success('Session marked as completed!');
      setConnection({ ...connection, status: 'completed' });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !connection) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Connection not found</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{error || 'This connection does not exist.'}</p>
        <Link to="/messages" className="mt-6 inline-block">
          <Button variant="secondary">Back to messages</Button>
        </Link>
      </div>
    );
  }

  const requester =
    typeof connection.requesterId === 'object' ? connection.requesterId : null;
  const teacher =
    typeof connection.teacherId === 'object' ? connection.teacherId : null;
  const skill =
    typeof connection.skillId === 'object' ? connection.skillId : null;

  const isTeacher = me?._id === (teacher?._id || connection.teacherId);
  const isRequester = me?._id === (requester?._id || connection.requesterId);
  const other = isTeacher ? requester : teacher;

  return (
    <div className="page-shell animate-fade-in py-8">
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Connection Details</h1>
          <Badge color={STATUS_COLORS[connection.status] as 'amber' | 'green' | 'red' | 'blue' | 'gray'}>
            {connection.status}
          </Badge>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <Avatar
            src={other?.avatar || undefined}
            name={other?.displayName || 'User'}
            size="lg"
          />
          <div>
            <Link
              to={`/profile/${other?._id || ''}`}
              className="text-base font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600"
            >
              {other?.displayName || 'Unknown'}
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isTeacher ? 'Requester' : 'Teacher'}
            </p>
          </div>
        </div>

        {skill && (
          <div className="mt-4 rounded-md bg-gray-50 dark:bg-gray-900 p-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Skill: {skill.skillName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {skill.categoryName} · {skill.type === 'teach' ? 'Teaching' : 'Learning'}
            </p>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{connection.message}</p>
        </div>

        <div className="mt-3">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Format: {connection.proposedFormat} · Sent: {new Date(connection.createdAt).toLocaleDateString()}
          </p>
        </div>

        {connection.responseMessage && (
          <div className="mt-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Response</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{connection.responseMessage}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-100 pt-4">
          {connection.status === 'pending' && isTeacher && (
            <>
              <Button loading={actionLoading} onClick={handleAccept}>
                Accept
              </Button>
              <Button variant="secondary" loading={actionLoading} onClick={handleReject}>
                Reject
              </Button>
            </>
          )}

          {connection.status === 'pending' && isRequester && (
            <Button
              variant="danger"
              loading={actionLoading}
              onClick={() => {
                if (!window.confirm('Withdraw this request?')) return;
                setActionLoading(true);
                import('../../services/connections')
                  .then((m) => m.withdrawRequest(connection._id))
                  .then(() => {
                    toast.success('Request withdrawn');
                    setConnection({ ...connection, status: 'withdrawn' });
                  })
                  .catch((err) => toast.error(getApiError(err)))
                  .finally(() => setActionLoading(false));
              }}
            >
              Withdraw
            </Button>
          )}

          {connection.status === 'accepted' && (
            <>
              <Link to={`/messages?conversationId=${encodeURIComponent(connection._id)}&type=skill`}>
                <Button>Open chat</Button>
              </Link>
              <Button variant="secondary" loading={actionLoading} onClick={handleComplete}>
                Mark completed
              </Button>
              <Button variant="danger" loading={actionLoading} onClick={handleCancel}>
                Cancel
              </Button>
            </>
          )}

          {connection.status === 'completed' && (
            <>
              <Button variant="secondary" onClick={() => setShowReview(true)}>
                {existingReview ? 'Edit review' : 'Leave a review'}
              </Button>
              {other && skill && (
                <EndorsementButton
                  endorseeId={other._id}
                  skillId={skill._id}
                  connectionId={connection._id}
                />
              )}
            </>
          )}

          <Button variant="ghost" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>
      </div>

      {connection.status === 'completed' && (
        <div className="card mt-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Reflections</h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Your private journal notes for this session.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowJournal(true)}>
              Write reflection
            </Button>
          </div>

          {journalEntries.length === 0 ? (
            <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">
              No reflections yet — capture what you learned or taught.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {journalEntries.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-gray-100 dark:border-gray-800 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs italic text-gray-500 dark:text-gray-400">“{entry.prompt}”</p>
                    <span className="shrink-0 text-lg" title={moodEmoji(entry.mood)?.label}>
                      {moodEmoji(entry.mood)?.emoji}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">{entry.content}</p>
                  <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {other && (
        <ReviewFormModal
          open={showReview}
          onClose={() => setShowReview(false)}
          connectionId={connection._id}
          connectionTitle={`Session with ${other.displayName}${skill ? ` · ${skill.skillName}` : ''}`}
          mode={existingReview ? 'edit' : 'create'}
          initial={existingReview}
          onSubmitted={() => {
            getMyConnectionReview(connection._id)
              .then(setExistingReview)
              .catch(() => {});
          }}
        />
      )}

      <JournalEntryFormModal
        open={showJournal}
        onClose={() => setShowJournal(false)}
        fixedConnectionId={connection._id}
        fixedConnectionTitle={skill ? `Session on ${skill.skillName}` : 'This session'}
        onSubmitted={() => {
          listConnectionEntries(connection._id)
            .then(setJournalEntries)
            .catch(() => {});
        }}
      />
    </div>
  );
}
