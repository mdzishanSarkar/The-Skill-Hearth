import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getShowcase, likeShowcase } from '../../services/showcase.service';
import type { Showcase } from '../../types/showcase.types';
import { getApiError } from '../../types/api.types';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { FiZap, FiArrowLeft } from 'react-icons/fi';

export default function ShowcaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showcase, setShowcase] = useState<Showcase | null>(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    if (!id) return;
    getShowcase(id)
      .then(setShowcase)
      .catch((err) => {
        toast.error(getApiError(err));
        navigate('/showcase', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  async function handleLike() {
    if (!showcase) return;
    setLiking(true);
    try {
      const result = await likeShowcase(showcase._id);
      setShowcase((prev) => (prev ? { ...prev, likeCount: result.likeCount } : prev));
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLiking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!showcase) {
    return (
      <EmptyState
        className="mt-16"
        icon={<FiZap />}
        title="Showcase not found"
        description="This project may have been removed."
        action={
          <Link to="/showcase">
            <Button variant="secondary">Back to showcase</Button>
          </Link>
        }
      />
    );
  }

  const author = showcase.userId;
  const isOwner = Boolean(author && user?._id === author._id);

  return (
    <div className="page-shell animate-fade-in py-8">
      <div className="mb-4">
        <Link
          to="/showcase"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to showcase
        </Link>
      </div>

      <PageHeader
        icon={<FiZap />}
        title={showcase.title}
        subtitle={`by ${author?.displayName ?? 'Unknown member'}`}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              About this project
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-200">
              {showcase.description}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
              {showcase.skillId && (
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {showcase.skillId.skillName}
                  {showcase.skillId.categoryName ? ` · ${showcase.skillId.categoryName}` : ''}
                </span>
              )}
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Published {new Date(showcase.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {showcase.media.length > 0 && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Media ({showcase.media.length})
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {showcase.media.map((media, index) => (
                  <figure key={media.publicId || index} className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <a href={media.url} target="_blank" rel="noreferrer">
                      <img
                        src={media.url}
                        alt={media.caption || showcase.title}
                        className="h-48 w-full object-cover transition-transform hover:scale-105"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </a>
                    {media.caption && (
                      <figcaption className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                        {media.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Author
            </h2>
            <div className="mt-3 flex items-center gap-3">
              {author ? (
                <>
                  <img
                    src={author.avatar}
                    alt={author.displayName}
                    className="h-10 w-10 rounded-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(author.displayName)}&background=4f46e5&color=fff`;
                    }}
                  />
                  <div className="min-w-0">
                    <Link
                      to={`/profile/${author._id}`}
                      className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {author.displayName}
                    </Link>
                    {author.stats && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {author.stats.totalSessions ?? 0} sessions
                        {typeof author.stats.averageRating === 'number'
                          ? ` · ${author.stats.averageRating.toFixed(1)}★`
                          : ''}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">Unknown member</span>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Reactions
            </h2>
            <div className="mt-4 flex items-center gap-4">
              <Button
                variant="secondary"
                size="sm"
                loading={liking}
                onClick={handleLike}
              >
                ❤ {showcase.likeCount}
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {showcase.commentCount} comment{showcase.commentCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {isOwner && (
            <div className="card p-6">
              <Link to="/showcase">
                <Button variant="secondary" size="sm">Manage showcase</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
