import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listShowcases, likeShowcase } from '../../services/showcase.service';
import type { ShowcaseListResult } from '../../types/showcase.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiZap, FiPlus } from 'react-icons/fi';

export default function ShowcasePage() {
  const [data, setData] = useState<ShowcaseListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [likingId, setLikingId] = useState('');

  useEffect(() => {
    loadShowcases();
  }, [page]);

  async function loadShowcases() {
    try {
      const result = await listShowcases({ page, limit: 12 });
      setData(result);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(showcaseId: string) {
    setLikingId(showcaseId);
    try {
      const result = await likeShowcase(showcaseId);
      setData((prev) =>
        prev
          ? {
              ...prev,
              showcases: prev.showcases.map((s) =>
                s._id === showcaseId ? { ...s, likeCount: result.likeCount } : s
              ),
            }
          : prev
      );
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLikingId('');
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
        icon={<FiZap />}
        title="Showcase"
        subtitle="Community members sharing their skill projects and achievements."
        actions={
          <Link to="/showcase/new">
            <Button size="sm">
              <FiPlus className="h-4 w-4" />
              Share a Project
            </Button>
          </Link>
        }
      />

      {data && data.showcases.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiZap />}
          title="No showcases yet"
          description="Be the first to share a skill project or achievement!"
        />
      ) : (
        <div className="mt-6 space-y-4">
          {data?.showcases.map((showcase) => (
            <div
              key={showcase._id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/showcase/${showcase._id}`}
                    className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600"
                  >
                    {showcase.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">{showcase.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {showcase.skillId && (
                      <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5">
                        {showcase.skillId.skillName}
                      </span>
                    )}
                    <span>{showcase.media.length} file{showcase.media.length === 1 ? '' : 's'}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    by {showcase.userId.displayName} · {new Date(showcase.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={likingId === showcase._id}
                  onClick={() => handleLike(showcase._id)}
                >
                  ❤ {showcase.likeCount}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Prev
          </Button>
          <span className="py-2 text-sm text-gray-600 dark:text-gray-400">Page {page} of {data.totalPages}</span>
          <Button variant="secondary" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
