import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listChallenges, joinChallenge } from '../../services/challenge.service';
import type { ChallengeListResult } from '../../types/challenge.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiFlag, FiChevronLeft, FiChevronRight, FiRefreshCw, FiCheck } from 'react-icons/fi';
import { showError, showSuccess } from '../../utils/toast';
import { useAuth } from '../../hooks/useAuth';

export default function ChallengesPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ChallengeListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [joiningId, setJoiningId] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listChallenges({ page, limit: 12 })
      .then((result) => {
        if (!cancelled) setData(result);
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
  }, [page]);

  async function handleJoin(challengeId: string) {
    setJoiningId(challengeId);
    try {
      await joinChallenge(challengeId);
      showSuccess('Joined the challenge!');
      setLoading(true);
      const result = await listChallenges({ page, limit: 12 });
      setData(result);
    } catch (err) {
      showError(getApiError(err));
    } finally {
      setJoiningId('');
      setLoading(false);
    }
  }

  function statusBadge(status: string) {
    const color = status === 'active' ? 'green' : status === 'upcoming' ? 'blue' : 'gray';
    return <Badge color={color}>{status}</Badge>;
  }

  const goToPage = (next: number) => {
    if (!data || next < 1 || next > data.totalPages || next === page) return;
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiFlag />}
        onIconClick={() => {
          setPage(1);
          setLoading(true);
          listChallenges({ page: 1, limit: 12 })
            .then(setData)
            .catch((err) => showError(getApiError(err)))
            .finally(() => setLoading(false));
        }}
        title="Challenges"
        subtitle="Skill challenges to motivate teaching and learning — earn badges for completing goals."
        actions={
          <Button variant="secondary" size="sm" onClick={() => {
            setPage(1);
            setLoading(true);
            listChallenges({ page: 1, limit: 12 })
              .then(setData)
              .catch((err) => showError(getApiError(err)))
              .finally(() => setLoading(false));
          }}>
            <FiRefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        }
      />

      {data && data.challenges.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiFlag />}
          title="No challenges yet"
          description="Challenges will appear here once the community creates them."
        />
      ) : (
<>
          {loading && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-xs font-medium text-indigo-600 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300">
              <Spinner size="sm" />
              Loading page {page}…
            </div>
          )}
          <div className="mt-6 space-y-4">
            {data?.challenges.map((challenge) => {
              const joined = user
                ? challenge.participants.some((p) => {
                    const raw = p.userId as unknown;
                    const pid =
                      typeof raw === 'object' && raw !== null
                        ? (raw as { _id?: string })._id ?? ''
                        : (raw as string);
                    return String(pid) === user._id;
                  })
                : false;
              return (
                <div
                  key={challenge._id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{challenge.title}</h3>
                        {statusBadge(challenge.status)}
                        <Badge color="purple">{challenge.challengeType}</Badge>
                      </div>
                      {challenge.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">{challenge.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{challenge.skillCategory}</span>
                        <span>·</span>
                        <span>Goal: {challenge.goalDescription}</span>
                        <span>·</span>
                        <span>{challenge.participants.length} participant{challenge.participants.length === 1 ? '' : 's'}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {new Date(challenge.startDate).toLocaleDateString()} — {new Date(challenge.endDate).toLocaleDateString()}
                        {' · by '}{challenge.creatorId.displayName}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <span className="text-lg">{challenge.badgeIcon}</span>
                      <Link
                        to={`/challenges/${challenge._id}`}
                        className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                      >
                        Details
                      </Link>
                      {joined ? (
                        <Button variant="secondary" size="sm" disabled>
                          <FiCheck className="mr-1 h-3.5 w-3.5" /> Joined
                        </Button>
                      ) : (
                        challenge.status === 'active' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={joiningId === challenge._id}
                            onClick={() => handleJoin(challenge._id)}
                          >
                            Join
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {data && data.totalPages > 1 && (
        <nav aria-label="Challenges pagination" className="mt-8 flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            <FiChevronLeft className="mr-1 h-4 w-4" /> Prev
          </Button>
          <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">
            Page <span className="font-semibold text-gray-900 dark:text-gray-100">{page}</span> of {data.totalPages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= data.totalPages} onClick={() => goToPage(page + 1)}>
            Next <FiChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}
