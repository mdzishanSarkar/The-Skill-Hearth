import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getSwapSuggestions, createSwap } from '../../services/swap.service';
import type { SwapSuggestion } from '../../types/social.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Skill Swap Suggestions</h1>
      <p className="mt-1 text-sm text-gray-500">
        Users who want to learn what you teach, and can teach what you want to learn.
      </p>

      {suggestions.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">No swap suggestions available right now.</p>
          <p className="mt-1 text-xs text-gray-400">
            Add more skills to your profile to increase your chances of finding matches.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {suggestions.map((s) => (
            <div
              key={s.otherUser._id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.otherUser.displayName}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">They teach:</span>{' '}
                      {s.otherTeachesSkill.skillName}
                    </p>
                    <p className="text-sm text-gray-600">
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
