import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listBundles, voteOnBundle } from '../../services/bundle.service';
import type { SkillBundle } from '../../types/social.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import CreateBundleForm from '../../components/forms/CreateBundleForm';
import { FiLayers, FiPlus, FiTarget } from 'react-icons/fi';
import { showError } from '../../utils/toast';

export default function BundlesPage() {
  const [bundles, setBundles] = useState<SkillBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [votingId, setVotingId] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadBundles();
  }, [page]);

  async function loadBundles() {
    try {
      const data = await listBundles(page);
      setBundles(data.bundles);
      setTotalPages(data.totalPages);
    } catch (err) {
      showError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(bundleId: string) {
    setVotingId(bundleId);
    try {
      const result = await voteOnBundle(bundleId);
      setBundles((prev) =>
        prev.map((b) => (b._id === bundleId ? { ...b, votes: result.votes } : b))
      );
    } catch (err) {
      showError(getApiError(err));
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
        icon={<FiLayers />}
        title="Skill Bundles"
        subtitle="Curated learning paths — bundles of related skills to help you learn systematically."
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <FiPlus className="h-4 w-4" />
            Create bundle
          </Button>
        }
      />

      <div className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/30">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-indigo-900 dark:text-indigo-200">
          <FiTarget className="h-4 w-4" />
          Why bundles?
        </h2>
        <p className="mt-2 text-sm text-indigo-900/90 dark:text-indigo-200/90">
          Learning one skill in isolation rarely sticks. Bundles group related skills into a learning path — so a
          learner can build a practical, connected set of abilities. Anyone can create a bundle from their own teach
          skills, and the community votes the best paths to the top.
        </p>
        <ol className="mt-3 space-y-1.5 text-sm text-indigo-900/90 dark:text-indigo-200/90">
          <li><span className="font-medium">1. Create</span> — group 2–10 of your teach skills into a named path.</li>
          <li><span className="font-medium">2. Browse</span> — discover community-built paths, sorted by votes.</li>
          <li><span className="font-medium">3. Vote</span> — upvote bundles you'd recommend to a neighbor.</li>
        </ol>
      </div>

      {bundles.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiLayers />}
          title="No bundles yet"
          description="Curated learning bundles will appear here once the community creates them."
          action={
            <Button variant="secondary" size="sm" onClick={() => setShowCreate(true)}>
              Create the first bundle
            </Button>
          }
        />
      ) : (
        <div className="mt-6 space-y-4">
          {bundles.map((bundle) => (
            <div
              key={bundle._id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{bundle.name}</h3>
                    {bundle.isOfficial && (
                      <Badge color="indigo">Official</Badge>
                    )}
                  </div>
                  {bundle.description && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{bundle.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {bundle.skillIds.map((skill) => (
                      <span
                        key={skill._id}
                        className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300"
                      >
                        {skill.skillName}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    by {bundle.createdBy.displayName}
                  </p>
                </div>
                <div className="ml-4 flex flex-col items-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={votingId === bundle._id}
                    onClick={() => handleVote(bundle._id)}
                  >
                    {bundle.votes} vote{bundle.votes === 1 ? '' : 's'}
                  </Button>
                  <Link
                    to={`/bundles/${bundle._id}`}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                  >
                    View details
                  </Link>
                </div>
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
          <span className="py-2 text-sm text-gray-600 dark:text-gray-400">Page {page} of {totalPages}</span>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}

      <CreateBundleForm
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setPage(1);
          loadBundles();
        }}
      />
    </div>
  );
}
