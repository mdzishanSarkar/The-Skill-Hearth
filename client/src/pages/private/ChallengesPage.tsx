import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listChallenges, joinChallenge } from '../../services/challenge.service';
import type { ChallengeListResult } from '../../types/challenge.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export default function ChallengesPage() {
  const [data, setData] = useState<ChallengeListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [joiningId, setJoiningId] = useState('');

  useEffect(() => {
    loadChallenges();
  }, [page]);

  async function loadChallenges() {
    try {
      const result = await listChallenges({ page, limit: 12 });
      setData(result);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(challengeId: string) {
    setJoiningId(challengeId);
    try {
      await joinChallenge(challengeId);
      toast.success('Joined the challenge!');
      loadChallenges();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setJoiningId('');
    }
  }

  function statusBadge(status: string) {
    const color = status === 'active' ? 'green' : status === 'upcoming' ? 'blue' : 'gray';
    return <Badge color={color}>{status}</Badge>;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Challenges</h1>
      <p className="mt-1 text-sm text-gray-500">
        Skill challenges to motivate teaching and learning — earn badges for completing goals.
      </p>

      {data && data.challenges.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">No challenges yet.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {data?.challenges.map((challenge) => (
            <div
              key={challenge._id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{challenge.title}</h3>
                    {statusBadge(challenge.status)}
                    <Badge color="purple">{challenge.challengeType}</Badge>
                  </div>
                  {challenge.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-600">{challenge.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span>{challenge.skillCategory}</span>
                    <span>·</span>
                    <span>Goal: {challenge.goalDescription}</span>
                    <span>·</span>
                    <span>{challenge.participants.length} participant{challenge.participants.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {new Date(challenge.startDate).toLocaleDateString()} — {new Date(challenge.endDate).toLocaleDateString()}
                    {' · by '}{challenge.creatorId.displayName}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  <span className="text-lg">{challenge.badgeIcon}</span>
                  <Link
                    to={`/challenges/${challenge._id}`}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Details
                  </Link>
                  {challenge.status === 'active' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={joiningId === challenge._id}
                      onClick={() => handleJoin(challenge._id)}
                    >
                      Join
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Prev
          </Button>
          <span className="py-2 text-sm text-gray-600">Page {page} of {data.totalPages}</span>
          <Button variant="secondary" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
