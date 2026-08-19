import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  listLearnerRequests,
  respondToLearnerRequest,
  createLearnerRequest,
} from '../../services/discoveryEnhanced.service';
import type { LearnerRequest } from '../../types/discovery.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiCompass, FiPlus } from 'react-icons/fi';
import { showError, showSuccess } from '../../utils/toast';

export default function LearnerBoardPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LearnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<'in-person' | 'online' | 'either'>('either');
  const [submitting, setSubmitting] = useState(false);
  const [respondingId, setRespondingId] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listLearnerRequests(page)
      .then((data) => {
        if (cancelled) return;
        setRequests(data.requests);
        setTotalPages(data.totalPages);
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

  async function loadRequests() {
    try {
      const data = await listLearnerRequests(page);
      setRequests(data.requests);
      setTotalPages(data.totalPages);
    } catch (err) {
      showError(getApiError(err));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!skillName.trim() || !categoryName.trim()) {
      showError('Skill name and category are required');
      return;
    }
    if (!user?.location?.city) {
      showError('Set your city in your profile first so learners can find you.');
      return;
    }
    setSubmitting(true);
    try {
      await createLearnerRequest({
        skillName,
        categoryName,
        description,
        city: user.location.city,
        neighborhood: user.location.neighborhood,
        format,
      });
      showSuccess('Request posted!');
      setSkillName('');
      setCategoryName('');
      setDescription('');
      setShowForm(false);
      loadRequests();
    } catch (err) {
      showError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRespond(requestId: string) {
    setRespondingId(requestId);
    try {
      await respondToLearnerRequest(requestId);
      showSuccess('Response sent!');
      loadRequests();
    } catch (err) {
      showError(getApiError(err));
    } finally {
      setRespondingId('');
    }
  }

  const goToPage = (next: number) => {
    if (next < 1 || next > totalPages || next === page) return;
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && requests.length === 0) {
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
        title="Looking for a Teacher"
        subtitle="Learners post what they want to learn. Teachers browse and offer to help."
        actions={
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <FiPlus className="h-4 w-4" />
            {showForm ? 'Cancel' : 'Post a request'}
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">What do you want to learn?</h3>
          <div className="mt-4 space-y-3">
            <Input
              id="skill-name"
              label="Skill"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g., Baking bread"
            />
            <Input
              id="category-name"
              label="Category"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g., Food & Cooking"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                rows={3}
                maxLength={1000}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
                placeholder="Tell teachers what you're looking for..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as 'in-person' | 'online' | 'either')}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none"
              >
                <option value="either">Either</option>
                <option value="in-person">In-person</option>
                <option value="online">Online</option>
              </select>
            </div>
            <Button type="submit" size="sm" loading={submitting}>
              Post request
            </Button>
          </div>
        </form>
      )}

      {requests.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiCompass />}
          title="No open requests yet"
          description="Be the first to post what you want to learn!"
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
          {requests.map((req) => (
            <div
              key={req._id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{req.skillName}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{req.categoryName} · {req.format}</p>
                  {req.description && (
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{req.description}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    by {req.authorId.displayName} · {new Date(req.createdAt).toLocaleDateString()}
                    {req.responsesCount > 0 && ` · ${req.responsesCount} response${req.responsesCount === 1 ? '' : 's'}`}
                  </p>
                </div>
                {user && user._id !== req.authorId._id && (
                  <Button
                    size="sm"
                    loading={respondingId === req._id}
                    onClick={() => handleRespond(req._id)}
                  >
                    I can teach this
                  </Button>
                )}
              </div>
            </div>
          ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <nav aria-label="Learner requests pagination" className="mt-6 flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            Prev
          </Button>
          <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">
            Page <span className="font-semibold text-gray-900 dark:text-gray-100">{page}</span> of {totalPages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}
