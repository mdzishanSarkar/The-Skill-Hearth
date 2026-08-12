import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getSwapSuggestions, createSwap } from '../../services/swap.service';
import type { SwapSuggestion } from '../../types/social.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiRefreshCw } from 'react-icons/fi';

export default function SwapSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<SwapSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState('');

  useEffect(() => {
    loadSuggestions();
  }, []);

  async function loadSuggestions() {
    try {
      const data = await getSwapSuggestions();
      setSuggestions(data);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSwap(suggestion: SwapSuggestion) {
    setCreatingId(suggestion.otherUser._id);
    try {
      await createSwap(
        suggestion.otherUser._id,
        suggestion.userTeachesSkill.skillId,
        suggestion.otherTeachesSkill.skillId,
      );
      toast.success('Swap suggestion sent!');
      setSuggestions((prev) => prev.filter((s) => s.otherUser._id !== suggestion.otherUser._id));
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setCreatingId('');
    }
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
        icon={<FiRefreshCw />}
        title="Skill Swap Suggestions"
        subtitle="Users who want to learn what you teach, and can teach what you want to learn."
      />

      {suggestions.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiRefreshCw />}
          title="No swap suggestions right now"
          description="Add more skills to your profile to increase your chances of finding matches."
        />
      ) : (
        <div className="mt-6 space-y-4">
          {suggestions.map((s) => (
            <div
              key={s.otherUser._id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.otherUser.displayName}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">They teach:</span>{' '}
                      {s.otherTeachesSkill.skillName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">You teach:</span>{' '}
                      {s.userTeachesSkill.skillName}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  loading={creatingId === s.otherUser._id}
                  onClick={() => handleCreateSwap(s)}
                >
                  Suggest swap
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
