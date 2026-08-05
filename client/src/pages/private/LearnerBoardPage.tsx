import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
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
    loadRequests();
  }, [page]);

  async function loadRequests() {
    try {
      const data = await listLearnerRequests(page);
      setRequests(data.requests);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!skillName.trim() || !categoryName.trim() || !user?.location.city) {
      toast.error('Skill name and category are required');
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
      toast.success('Request posted!');
      setSkillName('');
      setCategoryName('');
      setDescription('');
      setShowForm(false);
      loadRequests();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRespond(requestId: string) {
    setRespondingId(requestId);
    try {
      await respondToLearnerRequest(requestId);
      toast.success('Response sent!');
      loadRequests();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setRespondingId('');
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Looking for a Teacher</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Post a request'}
        </Button>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Learners post what they want to learn. Teachers browse and offer to help.
      </p>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">What do you want to learn?</h3>
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
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                rows={3}
                maxLength={1000}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Tell teachers what you're looking for..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as 'in-person' | 'online' | 'either')}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
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
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">No open requests yet. Be the first to post one!</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">{req.skillName}</h3>
                  <p className="text-xs text-gray-500">{req.categoryName} · {req.format}</p>
                  {req.description && (
                    <p className="mt-2 text-sm text-gray-700 line-clamp-2">{req.description}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
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
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Prev
          </Button>
          <span className="py-2 text-sm text-gray-600">Page {page} of {totalPages}</span>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
