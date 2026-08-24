import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getChallenge, joinChallenge } from '../../services/challenge.service';
import type { Challenge } from '../../types/challenge.types';
import { getApiError } from '../../types/api.types';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { FiArrowLeft, FiCalendar } from 'react-icons/fi';
import { showError, showSuccess } from '../../utils/toast';

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const loadChallenge = useCallback(async () => {
    try {
      const data = await getChallenge(id!);
      setChallenge(data);
    } catch (err) {
      showError(getApiError(err));
      navigate('/challenges');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!id) {
      navigate('/challenges');
      return;
    }
    loadChallenge();
  }, [id, navigate, loadChallenge]);

  async function handleJoin() {
    if (!id) return;
    setJoining(true);
    try {
      await joinChallenge(id);
      showSuccess('Joined the challenge!');
      loadChallenge();
    } catch (err) {
      showError(getApiError(err));
    } finally {
      setJoining(false);
    }
  }

  function statusBadgeColor(status: string) {
    return status === 'active' ? 'green' : status === 'upcoming' ? 'blue' : 'gray';
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="page-shell py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Challenge not found</h1>
          <Link to="/challenges" className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
            Back to challenges
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell py-8">
      <button
        onClick={() => navigate('/challenges')}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to challenges
      </button>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{challenge.title}</h1>
              <Badge color={statusBadgeColor(challenge.status)}>{challenge.status}</Badge>
            </div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              by {challenge.creatorId && typeof challenge.creatorId === 'object' ? challenge.creatorId.displayName : 'Unknown member'}
            </p>
          </div>
          <div className="text-5xl">{challenge.badgeIcon}</div>
        </div>

        {challenge.description && (
          <p className="mb-6 text-gray-700 dark:text-gray-300">{challenge.description}</p>
        )}

        <div className="mb-8 grid grid-cols-4 gap-4 rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">PARTICIPANTS</p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
              {challenge.participants.length}
              {challenge.maxParticipants ? `/${challenge.maxParticipants}` : ''}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">CATEGORY</p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">{challenge.skillCategory}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">TYPE</p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">{challenge.challengeType}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">GOAL</p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">{challenge.goalTarget}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Challenge Details</h2>
          <div className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">GOAL DESCRIPTION</p>
              <p className="mt-1 text-gray-900 dark:text-gray-100">{challenge.goalDescription}</p>
            </div>
            <div className="flex items-center gap-4 pt-3">
              <div className="flex items-center gap-2">
                <FiCalendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(challenge.startDate).toLocaleDateString()}
                </span>
              </div>
              <span className="text-gray-400">—</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(challenge.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {user && challenge.status === 'active' && (
          <Button
            onClick={handleJoin}
            loading={joining}
            disabled={
              challenge.maxParticipants
                ? challenge.participants.length >= challenge.maxParticipants
                : false
            }
            size="lg"
          >
            Join Challenge
          </Button>
        )}
      </div>
    </div>
  );
}
