import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getUserReviews } from '../../services/reviews';
import type { Review } from '../../types/review.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import { FiChevronLeft, FiChevronRight, FiRefreshCw, FiStar, FiUsers } from 'react-icons/fi';
import ReviewCard from '../../components/shared/ReviewCard';

const PAGE_SIZE = 5;

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    getUserReviews(user._id, page, PAGE_SIZE)
      .then((data) => {
        if (cancelled) return;
        setReviews(data.reviews);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch((err) => {
        if (!cancelled) toast.error(getApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, page]);

  const refresh = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const data = await getUserReviews(user._id, 1, PAGE_SIZE);
      setPage(1);
      setReviews(data.reviews);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setRefreshing(false);
    }
  };

  const goToPage = (next: number) => {
    if (next < 1 || next > totalPages || next === page) return;
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const avg = user?.stats?.averageRating ?? 0;

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiStar />}
        onIconClick={refresh}
        title="My Reviews"
        subtitle="What the community says about your teaching."
        actions={
          <Button variant="secondary" size="sm" onClick={refresh} loading={refreshing}>
            <FiRefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="mt-6 grid max-w-md grid-cols-2 gap-4">
        <StatCard icon={<FiStar />} label="Average rating" value={avg.toFixed(1)} tone="amber" />
        <StatCard icon={<FiUsers />} label="Reviews" value={total} tone="indigo" />
      </div>

      {loading && reviews.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiStar />}
          title="No reviews yet"
          description="Complete sessions and you'll start collecting reviews."
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
            {reviews.map((review) => (
              <div key={review._id}>
                {review.skill && (
                  <p className="mb-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    About: {review.skill.skillName}
                  </p>
                )}
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <nav aria-label="Reviews pagination" className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            <FiChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400">
            Page <span className="font-semibold text-gray-900 dark:text-gray-100">{page}</span> of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next <FiChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}