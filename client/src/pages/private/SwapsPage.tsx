import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { acceptSwap, declineSwap, listSwaps } from '../../services/swap.service';
import type { Swap } from '../../types/social.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiRefreshCw } from 'react-icons/fi';

type StatusFilter = 'all' | Swap['status'];

const filters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'suggested', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
];

const badgeColors: Record<Swap['status'], 'amber' | 'green' | 'gray'> = {
  suggested: 'amber',
  accepted: 'green',
  declined: 'gray',
};

const statusLabels: Record<Swap['status'], string> = {
  suggested: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
};

export default function SwapsPage() {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState('');

  useEffect(() => {
    loadSwaps();
  }, []);

  async function loadSwaps() {
    try {
      const data = await listSwaps();
      setSwaps(data);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const data = await listSwaps();
      setSwaps(data);
      toast.success('Swaps refreshed');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setRefreshing(false);
    }
  }

  async function handleAccept(swap: Swap) {
    setActionId(swap._id);
    try {
      const updated = await acceptSwap(swap._id);
      setSwaps((prev) => prev.map((s) => (s._id === swap._id ? updated : s)));
      toast.success('Swap accepted!');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setActionId('');
    }
  }

  async function handleDecline(swap: Swap) {
    setActionId(swap._id);
    try {
      const updated = await declineSwap(swap._id);
      setSwaps((prev) => prev.map((s) => (s._id === swap._id ? updated : s)));
      toast.success('Swap declined.');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setActionId('');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const visible = filter === 'all' ? swaps : swaps.filter((s) => s.status === filter);

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiRefreshCw className={refreshing ? 'animate-spin' : undefined} />}
        onIconClick={handleRefresh}
        title="Skill Swaps"
        subtitle="Your skill swap agreements — accept pending swaps to start learning."
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiRefreshCw />}
          title="No swaps here yet"
          description="Head to swap suggestions to find people who want to trade skills."
        />
      ) : (
        <div className="mt-6 space-y-4">
          {visible.map((swap) => {
            const isUserA = user?._id === swap.userAId._id;
            const otherUser = isUserA ? swap.userBId : swap.userAId;
            const otherSkill = isUserA ? swap.userBTeachesSkillId : swap.userATeachesSkillId;
            const mySkill = isUserA ? swap.userATeachesSkillId : swap.userBTeachesSkillId;
            return (
              <div
                key={swap._id}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar src={otherUser.avatar} name={otherUser.displayName} size="md" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {otherUser.displayName}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">They teach:</span> {otherSkill.skillName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">You teach:</span> {mySkill.skillName}
                        </p>
                      </div>
                      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                        {new Date(swap.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-3">
                    <Badge color={badgeColors[swap.status]}>{statusLabels[swap.status]}</Badge>
                    {swap.status === 'suggested' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={actionId === swap._id}
                          disabled={actionId === swap._id}
                          onClick={() => handleDecline(swap)}
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          loading={actionId === swap._id}
                          disabled={actionId === swap._id}
                          onClick={() => handleAccept(swap)}
                        >
                          Accept
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
