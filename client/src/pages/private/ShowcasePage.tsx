import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listShowcases, likeShowcase } from '../../services/showcase.service';
import type { Showcase, ShowcaseListResult } from '../../types/showcase.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Showcase</h1>
          <p className="mt-1 text-sm text-gray-500">
            Community members sharing their skill projects and achievements.
          </p>
        </div>
        <Link
          to="/showcase/new"
          className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500"
        >
          Share a Project
        </Link>
      </div>

      {data && data.showcases.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-500">No showcases yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {data?.showcases.map((showcase) => (
            <div
              key={showcase._id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/showcase/${showcase._id}`}
                    className="text-sm font-semibold text-gray-900 hover:text-indigo-600"
                  >
                    {showcase.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-600">{showcase.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    {showcase.skillId && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5">
                        {showcase.skillId.skillName}
                      </span>
                    )}
                    <span>{showcase.media.length} file{showcase.media.length === 1 ? '' : 's'}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
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
          <span className="py-2 text-sm text-gray-600">Page {page} of {data.totalPages}</span>
          <Button variant="secondary" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
