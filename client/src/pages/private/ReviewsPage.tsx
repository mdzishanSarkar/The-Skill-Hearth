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
import { FiStar, FiUsers } from 'react-icons/fi';
import ReviewCard from '../../components/shared/ReviewCard';

const PAGE_SIZE = 5;

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getUserReviews(user._id, page, PAGE_SIZE)
      .then((data) => {
        setReviews(data.reviews);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch((err) => toast.error(getApiError(err)))
      .finally(() => setLoading(false));
  }, [user, page]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const avg = user?.stats?.averageRating ?? 0;

  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiStar />}
        title="My Reviews"
        subtitle="What the community says about your teaching."
      />

      <div className="mt-6 grid max-w-md grid-cols-2 gap-4">
        <StatCard icon={<FiStar />} label="Average rating" value={avg.toFixed(1)} tone="amber" />
        <StatCard icon={<FiUsers />} label="Reviews" value={total} tone="indigo" />
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<FiStar />}
          title="No reviews yet"
          description="Complete sessions and you'll start collecting reviews."
        />
      ) : (
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
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
