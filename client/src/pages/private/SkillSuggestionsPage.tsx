import { useEffect, useState } from 'react';
import { submitSuggestion, voteOnSuggestion, listPendingSuggestions, approveSuggestion, rejectSuggestion } from '../../services/suggestion.service';
import type { SkillSuggestion } from '../../types/social.types';
import { getApiError } from '../../types/api.types';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiPlus, FiThumbsUp, FiTarget, FiRefreshCw } from 'react-icons/fi';
import { showError, showSuccess } from '../../utils/toast';

const isStaff = (role?: string) => role === 'admin' || role === 'moderator';

const REVIEW_STEPS = [
  {
    title: 'Suggest',
    body: 'Anyone can propose a new skill with a category and a short rationale.',
  },
  {
    title: 'Vote',
    body: 'The community upvotes the suggestions they would actually use. High votes surface popular ideas.',
  },
  {
    title: 'Review',
    body: 'Admins and moderators review the highest-voted suggestions and approve or reject them with a note.',
  },
  {
    title: 'Add',
    body: 'Approved skills become part of the shared skill taxonomy that everyone can teach and learn.',
  },
];

export default function SkillSuggestionsPage() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState('');
  const [actionId, setActionId] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listPendingSuggestions()
      .then((data) => {
        if (!cancelled) setSuggestions(data.suggestions);
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
  }, [version]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!skillName.trim() || !categoryName.trim()) {
      showError('Skill name and category are required');
      return;
    }
    setSubmitting(true);
    try {
      await submitSuggestion(skillName, categoryName, description);
      showSuccess('Suggestion submitted!');
      setSkillName('');
      setCategoryName('');
      setDescription('');
      setShowForm(false);
      setVersion((v) => v + 1);
    } catch (err) {
      showError(getApiError(err));
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
      showError(getApiError(err));
    } finally {
      setVotingId('');
    }
  }

  async function handleReview(suggestionId: string, action: 'approve' | 'reject') {
    setActionId(suggestionId);
    try {
      if (action === 'approve') {
        await approveSuggestion(suggestionId);
        showSuccess('Suggestion approved');
      } else {
        await rejectSuggestion(suggestionId);
        showSuccess('Suggestion rejected');
      }
      setSuggestions((prev) => prev.filter((s) => s._id !== suggestionId));
    } catch (err) {
      showError(getApiError(err));
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

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiThumbsUp />}
        title="Skill Suggestions"
        subtitle="Vote on community-suggested skills or propose new ones."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setVersion((v) => v + 1)}>
              <FiRefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <FiPlus className="h-4 w-4" />
              {showForm ? 'Cancel' : 'Suggest a skill'}
            </Button>
          </div>
        }
      />

      <div className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/30">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-indigo-900 dark:text-indigo-200">
          <FiTarget className="h-4 w-4" />
          How suggestions become skills
        </h2>
        <ol className="mt-3 space-y-2">
          {REVIEW_STEPS.map((step, i) => (
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
      </div>

      {isStaff(user?.role) && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          You are a moderator/admin. Approve or reject pending suggestions below.
        </div>
      )}

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
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.skillName}</p>
                  <Badge color="blue">{s.categoryName}</Badge>
                </div>
                {s.description && (
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{s.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  by {s.userId.displayName}
                </p>
              </div>
              <div className="ml-4 flex flex-col items-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={votingId === s._id}
                  onClick={() => handleVote(s._id)}
                >
                  {s.votes} vote{s.votes === 1 ? '' : 's'}
                </Button>
                {isStaff(user?.role) && (
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      loading={actionId === s._id}
                      onClick={() => handleReview(s._id, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={actionId === s._id}
                      onClick={() => handleReview(s._id, 'reject')}
                    >
                      Reject
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
