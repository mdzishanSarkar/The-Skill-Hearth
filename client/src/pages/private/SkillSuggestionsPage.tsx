import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { submitSuggestion, voteOnSuggestion, listPendingSuggestions } from '../../services/suggestion.service';
import type { SkillSuggestion } from '../../types/social.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiPlus, FiThumbsUp } from 'react-icons/fi';

export default function SkillSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState('');

  useEffect(() => {
    loadSuggestions();
  }, []);

  async function loadSuggestions() {
    try {
      const data = await listPendingSuggestions();
      setSuggestions(data.suggestions);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!skillName.trim() || !categoryName.trim()) {
      toast.error('Skill name and category are required');
      return;
    }
    setSubmitting(true);
    try {
      await submitSuggestion(skillName, categoryName, description);
      toast.success('Suggestion submitted!');
      setSkillName('');
      setCategoryName('');
      setDescription('');
      setShowForm(false);
      loadSuggestions();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(suggestionId: string) {
    setVotingId(suggestionId);
    try {
      const result = await voteOnSuggestion(suggestionId);
      setSuggestions((prev) =>
        prev.map((s) => (s._id === suggestionId ? { ...s, votes: result.votes } : s))
      );
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setVotingId('');
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
        icon={<FiThumbsUp />}
        title="Skill Suggestions"
        subtitle="Vote on community-suggested skills or propose new ones."
        actions={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <FiPlus className="h-4 w-4" />
            {showForm ? 'Cancel' : 'Suggest a skill'}
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Suggest a new skill</h3>
          <div className="mt-4 space-y-3">
            <Input
              id="skill-name"
              label="Skill name"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g., Woodworking"
            />
            <Input
              id="category-name"
              label="Category"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g., Home & Garden"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                rows={2}
                maxLength={500}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
                placeholder="Why should this skill be added?"
              />
            </div>
            <Button type="submit" size="sm" loading={submitting}>
              Submit suggestion
            </Button>
          </div>
        </form>
      )}

      {suggestions.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiThumbsUp />}
          title="No pending suggestions"
          description="Be the first to suggest a new skill for the community."
        />
      ) : (
        <div className="mt-6 space-y-3">
          {suggestions.map((s) => (
            <div
              key={s._id}
              className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.skillName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {s.categoryName}
                  {s.description && ` — ${s.description}`}
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  by {s.userId.displayName}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                loading={votingId === s._id}
                onClick={() => handleVote(s._id)}
              >
                {s.votes} vote{s.votes === 1 ? '' : 's'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
