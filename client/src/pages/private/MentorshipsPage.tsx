import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyMentorships, respondToMentorship, updateGoal, completeMentorship } from '../../services/mentorship.service';
import type { Mentorship } from '../../types/mentorship.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiCompass, FiTarget } from 'react-icons/fi';
import { showError, showSuccess } from '../../utils/toast';

const HOW_IT_WORKS = [
  {
    title: 'Find a mentor',
    body: 'Browse skills near you. On any skill card marked "I can teach", open the details and tap "Request Mentorship" to start a longer-term learning relationship.',
  },
  {
    title: 'Set goals together',
    body: 'Propose learning goals, a duration, and how often you want to meet. The mentor reviews and accepts or declines your request.',
  },
  {
    title: 'Track progress',
    body: 'Once accepted, check in between sessions, mark goals complete, and watch the relationship grow toward completion.',
  },
];

const STATUS_COLORS: Record<string, 'amber' | 'green' | 'blue' | 'gray' | 'red'> = {
  pending: 'amber',
  active: 'green',
  paused: 'blue',
  completed: 'gray',
  cancelled: 'red',
};

export default function MentorshipsPage() {
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'as-mentor' | 'as-mentee'>('as-mentor');
  const [respondingId, setRespondingId] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [completeTarget, setCompleteTarget] = useState<string | null>(null);

  function switchTab(next: 'as-mentor' | 'as-mentee') {
    if (next === tab) return;
    setTab(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const loadMentorships = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMyMentorships(tab === 'as-mentor' ? 'mentor' : 'mentee');
      setMentorships(result);
    } catch (err) {
      showError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadMentorships();
  }, [loadMentorships]);

  async function handleRespond(id: string, action: 'accept' | 'reject') {
    setRespondingId(id);
    try {
      await respondToMentorship(id, action);
      showSuccess(action === 'accept' ? 'Mentorship accepted!' : 'Mentorship declined.');
      loadMentorships();
    } catch (err) {
      showError(getApiError(err));
    } finally {
      setRespondingId('');
    }
  }

  async function handleToggleGoal(id: string, goalIndex: number, completed: boolean) {
    setActionId(id);
    try {
      await updateGoal(id, goalIndex, completed);
      loadMentorships();
    } catch (err) {
      showError(getApiError(err));
    } finally {
      setActionId(null);
    }
  }

  async function handleComplete(id: string) {
    setCompleteTarget(null);
    setActionId(id);
    try {
      await completeMentorship(id);
      showSuccess('Mentorship completed!');
      loadMentorships();
    } catch (err) {
      showError(getApiError(err));
    } finally {
      setActionId(null);
    }
  }

  function statusBadge(status: string) {
    return <Badge color={STATUS_COLORS[status] || 'gray'}>{status}</Badge>;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiCompass />}
        title="Mentorships"
        subtitle="Long-term learning relationships with goals and check-ins, deeper than a single session."
      />

      <div className="mt-4 flex gap-2">
        <Button
          variant={tab === 'as-mentor' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => switchTab('as-mentor')}
        >
          As Mentor
        </Button>
        <Button
          variant={tab === 'as-mentee' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => switchTab('as-mentee')}
        >
          As Mentee
        </Button>
      </div>

      <div className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/30">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-indigo-900 dark:text-indigo-200">
          <FiTarget className="h-4 w-4" />
          How mentorships work
        </h2>
        <ol className="mt-3 space-y-2">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-indigo-900/90 dark:text-indigo-200/90">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-semibold text-white">
                {i + 1}
              </span>
              <span>
                <span className="font-medium">{step.title}.</span> {step.body}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-indigo-700/80 dark:text-indigo-300/80">
          To request mentorship, open any teach skill from the Browse skills page and tap "Request Mentorship".
        </p>
      </div>

      {mentorships.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiCompass />}
          title="No mentorships yet"
          description="Mentorship relationships will appear here once you find a match."
        />
      ) : (
        <div className="mt-6 space-y-4">
          {mentorships.map((m) => (
            <div key={m._id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const other = tab === 'as-mentor' ? m.menteeId : m.mentorId;
                      return (
                        <Link
                          to={`/profile/${other._id}`}
                          className="text-sm font-semibold text-gray-900 hover:text-indigo-600 dark:text-gray-100 dark:hover:text-indigo-400"
                        >
                          {other.displayName}
                        </Link>
                      );
                    })()}
                    {statusBadge(m.status)}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {m.skillId.skillName} · {m.durationMonths} months · {m.meetingFrequency}
                  </p>
                  {m.goals.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {m.goals.map((g, i) => (
                        <label key={i} className="flex cursor-pointer items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <input
                            type="checkbox"
                            checked={g.completed}
                            disabled={m.status !== 'active' || actionId === m._id}
                            onChange={(e) => handleToggleGoal(m._id, i, e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                          />
                          <span className={g.completed ? 'line-through opacity-60' : ''}>{g.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {m.checkIns.length} check-in{m.checkIns.length === 1 ? '' : 's'}
                    {m.targetEndDate ? ` · ends ${new Date(m.targetEndDate).toLocaleDateString()}` : ''}
                  </p>
                </div>
                {m.status === 'pending' && tab === 'as-mentor' && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="primary"
                      size="sm"
                      loading={respondingId === m._id}
                      onClick={() => handleRespond(m._id, 'accept')}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={respondingId === m._id}
                      onClick={() => handleRespond(m._id, 'reject')}
                    >
                      Decline
                    </Button>
                  </div>
                )}
                {m.status === 'active' && tab === 'as-mentor' && (
                  <div className="ml-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={actionId === m._id}
                      onClick={() => setCompleteTarget(m._id)}
                    >
                      Complete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!completeTarget}
        title="Mark as completed?"
        message="This will mark the mentorship as completed. You can track goals and check-ins afterward."
        confirmLabel="Complete mentorship"
        variant="info"
        loading={!!actionId}
        onConfirm={() => completeTarget && handleComplete(completeTarget)}
        onClose={() => setCompleteTarget(null)}
      />
    </div>
  );
}
