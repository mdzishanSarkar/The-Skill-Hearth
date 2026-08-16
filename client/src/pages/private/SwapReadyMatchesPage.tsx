import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiRepeat, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Avatar from '../../components/ui/Avatar';
import {
  getSwapReadyMatches,
  proposeSwapReadyMatch,
  hideSwapReadyMatch,
} from '../../services/swapReady.service';
import { getApiError } from '../../types/api.types';
import type { SwapReadyMatch } from '../../types/swapReady.types';

function MatchCard({
  match,
  onProposed,
  onHidden,
}: {
  match: SwapReadyMatch;
  onProposed: (id: string) => void;
  onHidden: (id: string) => void;
}) {
  const [busy, setBusy] = useState<'propose' | 'hide' | null>(null);

  const them = match.userIsA ? match.userBId : match.userAId;
  const theirSkill = match.userIsA ? match.userBTeachesSkillId : match.userATeachesSkillId;
  const mySkill = match.userIsA ? match.userATeachesSkillId : match.userBTeachesSkillId;

  async function handlePropose() {
    setBusy('propose');
    try {
      await proposeSwapReadyMatch(match._id);
      toast.success(`Swap proposed to ${them.displayName}`);
      onProposed(match._id);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleHide() {
    setBusy('hide');
    try {
      await hideSwapReadyMatch(match._id);
      onHidden(match._id);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Avatar src={them.avatar} name={them.displayName} />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{them.displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {them.location?.neighborhood || them.location?.city || 'Location not set'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 text-sm">
            <div className="min-w-0 flex-1 rounded-md bg-indigo-50 px-3 py-2 dark:bg-indigo-900/30">
              <p className="text-xs text-indigo-500 dark:text-indigo-300">They teach</p>
              <p className="truncate font-medium text-gray-900 dark:text-gray-100">{theirSkill.skillName}</p>
            </div>
            <FiArrowRight className="shrink-0 text-gray-400" />
            <div className="min-w-0 flex-1 rounded-md bg-amber-50 px-3 py-2 dark:bg-amber-900/30">
              <p className="text-xs text-amber-600 dark:text-amber-300">You teach</p>
              <p className="truncate font-medium text-gray-900 dark:text-gray-100">{mySkill.skillName}</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" loading={busy === 'propose'} onClick={handlePropose}>
            Propose swap
          </Button>
          <button
            type="button"
            onClick={handleHide}
            disabled={busy !== null}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800"
            title="Hide this match"
          >
            <FiEyeOff /> Hide
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SwapReadyMatchesPage() {
  const [matches, setMatches] = useState<SwapReadyMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      setMatches(await getSwapReadyMatches());
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  function removeMatch(id: string) {
    setMatches((prev) => prev.filter((m) => m._id !== id));
  }

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiRepeat />}
        title="Swap-Ready Matches"
        subtitle="People you and they are ready to swap with — you teach something they want, and they teach something you want."
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" />
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiRepeat />}
          title="No swap-ready matches yet"
          description="Add both teach and learn skills to your profile, and matches will appear here when the Hearth finds a perfect swap."
        />
      ) : (
        <div className="mt-6 space-y-4">
          {matches.map((match) => (
            <MatchCard key={match._id} match={match} onProposed={removeMatch} onHidden={removeMatch} />
          ))}
        </div>
      )}
    </div>
  );
}
