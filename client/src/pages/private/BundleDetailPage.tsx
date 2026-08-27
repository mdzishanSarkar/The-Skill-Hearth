import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBundle, voteOnBundle } from '../../services/bundle.service';
import type { SkillBundle } from '../../types/social.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { FiArrowLeft, FiLayers, FiTarget } from 'react-icons/fi';
import { showError } from '../../utils/toast';

export default function BundleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bundle, setBundle] = useState<SkillBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const loadBundle = useCallback(async () => {
    try {
      const data = await getBundle(id!);
      setBundle(data);
    } catch (err) {
      showError(getApiError(err));
      navigate('/bundles');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!id) {
      navigate('/bundles');
      return;
    }
    loadBundle();
  }, [id, navigate, loadBundle]);

  async function handleVote() {
    if (!id) return;
    setVoting(true);
    try {
      const result = await voteOnBundle(id);
      setBundle((prev) => (prev ? { ...prev, votes: result.votes } : prev));
    } catch (err) {
      showError(getApiError(err));
    } finally {
      setVoting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="page-shell py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bundle not found</h1>
          <Link to="/bundles" className="mt-4 inline-block text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
            Back to bundles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell py-8">
      <button
        onClick={() => navigate('/bundles')}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back to bundles
      </button>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8">
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{bundle.name}</h1>
          {bundle.isOfficial && <Badge color="indigo">Official</Badge>}
        </div>

        {bundle.description && (
          <p className="mb-6 text-gray-700 dark:text-gray-300">{bundle.description}</p>
        )}

        <div className="mb-8 flex items-center gap-3">
          <Avatar src={bundle.createdBy.avatar || undefined} name={bundle.createdBy.displayName} size="sm" />
          <div className="text-sm">
            <p className="font-medium text-gray-900 dark:text-gray-100">{bundle.createdBy.displayName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Created {new Date(bundle.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <FiTarget className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Skills in this path
          </h2>
          <div className="space-y-2">
            {bundle.skillIds.map((skill, i) => (
              <div
                key={skill._id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/skills/${skill._id}`}
                    className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    {skill.skillName}
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{skill.categoryName}</p>
                </div>
                <FiLayers className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>

        <Button variant="secondary" onClick={handleVote} loading={voting}>
          {bundle.votes} vote{bundle.votes === 1 ? '' : 's'}, upvote this path
        </Button>
      </div>
    </div>
  );
}
