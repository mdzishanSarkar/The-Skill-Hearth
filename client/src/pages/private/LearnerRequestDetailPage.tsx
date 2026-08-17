import { useParams, useNavigate, Link } from 'react-router-dom';
import { listLearnerRequests, respondToLearnerRequest } from '../../services/discoveryEnhanced.service';
import type { LearnerRequest } from '../../types/discovery.types';
import { getApiError } from '../../types/api.types';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { FiArrowLeft, FiUser, FiMapPin } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { showError, showSuccess } from '../../utils/toast';

export default function LearnerRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState<LearnerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/learner-board');
      return;
    }

    let isMounted = true;

    async function loadRequest() {
      try {
        const result = await listLearnerRequests(1, 200);
        const found = result.requests.find((item) => item._id === id);
        if (!isMounted) return;

        setRequest(found ?? null);
      } catch (err) {
        if (!isMounted) return;
        showError(getApiError(err));
        navigate('/learner-board');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadRequest();
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  async function handleRespond() {
    if (!id) return;
    setResponding(true);
    try {
      await respondToLearnerRequest(id);
      showSuccess('Response sent to the learner!');
      navigate('/learner-board');
    } catch (err) {
      showError(getApiError(err));
    } finally {
      setResponding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="page-shell py-8">
        <button
          onClick={() => navigate('/learner-board')}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to learner board
        </button>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Request not found</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Please go back and select a learner request.</p>
          <Link
            to="/learner-board"
            className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
          >
            Back to learner board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell py-8">
      <button
        onClick={() => navigate('/learner-board')}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to learner board
      </button>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{request.skillName}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Category: {request.categoryName}</p>
        </div>

        <div className="mb-8 rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
          <div className="flex items-center gap-2">
            <FiUser className="h-4 w-4" />
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {typeof request.authorId === 'object' ? request.authorId.displayName : 'Learner'}
            </span>
          </div>
          {request.city && (
            <div className="mt-2 flex items-center gap-2">
              <FiMapPin className="h-4 w-4" />
              <span className="text-gray-600 dark:text-gray-400">
                {request.city}
                {request.neighborhood && `, ${request.neighborhood}`}
              </span>
            </div>
          )}
        </div>

        {request.description && (
          <div className="mb-8">
            <h2 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">About the request</h2>
            <p className="text-gray-700 dark:text-gray-300">{request.description}</p>
          </div>
        )}

        <div className="mb-8 flex gap-2">
          <Badge color="blue">{request.format}</Badge>
        </div>

        {user && user._id !== (typeof request.authorId === 'object' ? request.authorId._id : request.authorId) && (
          <Button onClick={handleRespond} loading={responding} size="lg">
            I can teach this
          </Button>
        )}
      </div>
    </div>
  );
}
