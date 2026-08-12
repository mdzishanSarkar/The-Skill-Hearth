import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listBundles, voteOnBundle } from '../../services/bundle.service';
import type { SkillBundle } from '../../types/social.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiLayers } from 'react-icons/fi';

export default function BundlesPage() {
  const [bundles, setBundles] = useState<SkillBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [votingId, setVotingId] = useState('');

  useEffect(() => {
    loadBundles();
  }, [page]);

  async function loadBundles() {
    try {
      const data = await listBundles(page);
      setBundles(data.bundles);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error(getApiError(err));
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
        icon={<FiLayers />}
        title="Skill Bundles"
        subtitle="Curated learning paths — bundles of related skills to help you learn systematically."
      />

      {bundles.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiLayers />}
          title="No bundles yet"
          description="Curated learning bundles will appear here once the community creates them."
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
                <Button
                  variant="secondary"
                  size="sm"
                  loading={votingId === bundle._id}
                  onClick={() => handleVote(bundle._id)}
                >
                  {bundle.votes} vote{bundle.votes === 1 ? '' : 's'}
                </Button>
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
    </div>
  );
}
