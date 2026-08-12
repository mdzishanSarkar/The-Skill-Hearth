import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getMyMentorships, respondToMentorship } from '../../services/mentorship.service';
import type { Mentorship } from '../../types/mentorship.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiCompass } from 'react-icons/fi';

export default function MentorshipsPage() {
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'as-mentor' | 'as-mentee'>('as-mentor');
  const [respondingId, setRespondingId] = useState('');

  useEffect(() => {
    loadMentorships();
  }, [tab]);

  async function loadMentorships() {
    setLoading(true);
    try {
      const result = await getMyMentorships(tab === 'as-mentor' ? 'mentor' : 'mentee');
      setMentorships(result);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRespond(id: string, action: 'accept' | 'reject') {
    setRespondingId(id);
    try {
      await respondToMentorship(id, action);
      toast.success(action === 'accept' ? 'Mentorship accepted!' : 'Mentorship declined.');
      loadMentorships();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setRespondingId('');
    }
  }

  function statusBadge(status: string) {
    const colors: Record<string, NonNullable<React.ComponentProps<typeof Badge>['color']>> = {
      pending: 'amber',
      active: 'green',
      paused: 'blue',
      completed: 'gray',
      cancelled: 'red',
    };
    return <Badge color={colors[status] || 'gray'}>{status}</Badge>;
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
        subtitle="Long-term learning relationships with goals and check-ins."
      />

      <div className="mt-4 flex gap-2">
        <Button
          variant={tab === 'as-mentor' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTab('as-mentor')}
        >
          As Mentor
        </Button>
        <Button
          variant={tab === 'as-mentee' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTab('as-mentee')}
        >
          As Mentee
        </Button>
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
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {tab === 'as-mentor' ? m.menteeId.displayName : m.mentorId.displayName}
                    </h3>
                    {statusBadge(m.status)}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {m.skillId.skillName} · {m.durationMonths} months · {m.meetingFrequency}
                  </p>
                  {m.goals.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {m.goals.map((g, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span>{g.completed ? '✅' : '⬜'}</span>
                          <span>{g.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {m.checkIns.length} check-in{m.checkIns.length === 1 ? '' : 's'}
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
