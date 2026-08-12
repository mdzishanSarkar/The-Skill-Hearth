import { useState } from 'react';
import toast from 'react-hot-toast';
import { submitReview, updateReview } from '../../services/reviews';
import { getApiError } from '../../types/api.types';
import type { Review, ReviewTag } from '../../types/review.types';
import type { Connection } from '../../types/connection.types';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';

const AVAILABLE_TAGS: ReviewTag[] = [
  'Patient teacher',
  'Well-prepared',
  'Great listener',
  'Practical tips',
  'Enthusiastic',
  'Clear explanations',
  'Flexible',
  'Knowledgeable',
  'Punctual',
  'Engaging',
];

interface ReviewFormProps {
  connection: Connection;
  existingReview?: Review | null;
  onSuccess?: () => void;
}

function StarsInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
        >
          <svg
            className={`h-7 w-7 ${
              star <= (hover || value) ? 'text-amber-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ReviewForm({ connection, existingReview, onSuccess }: ReviewFormProps) {
  const { user: me } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [content, setContent] = useState(existingReview?.content || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(existingReview?.tags || []);
  const [wouldRecommend, setWouldRecommend] = useState(
    existingReview?.wouldRecommend !== undefined ? existingReview.wouldRecommend : true,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const other =
    me?._id === (typeof connection.requesterId === 'object' ? connection.requesterId._id : connection.requesterId)
      ? (typeof connection.teacherId === 'object' ? connection.teacherId : null)
      : (typeof connection.requesterId === 'object' ? connection.requesterId : null);
  const skill = typeof connection.skillId === 'object' ? connection.skillId : null;

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Please select a star rating.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (existingReview) {
        await updateReview(existingReview._id, {
          rating,
          content: content.trim(),
          tags: selectedTags,
          wouldRecommend,
        });
        toast.success('Review updated!');
      } else {
        await submitReview(connection._id, {
          rating,
          content: content.trim(),
          tags: selectedTags,
          wouldRecommend,
        });
        toast.success('Review submitted!');
      }
      onSuccess?.();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {existingReview ? 'Edit your review' : 'Leave a review'}
      </h3>
      {other && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Reviewing {other.displayName || 'the other participant'}
          {skill ? ` for ${skill.skillName}` : ''}
        </p>
      )}

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rating</label>
        <StarsInput value={rating} onChange={setRating} />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Written review</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 500))}
          rows={3}
          maxLength={500}
          placeholder="Share your experience..."
          className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{content.length}/500</p>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AVAILABLE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={
                selectedTags.includes(tag)
                  ? 'rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white'
                  : 'rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={wouldRecommend}
            onChange={(e) => setWouldRecommend(e.target.checked)}
            className="h-4 w-4 accent-indigo-600"
          />
          Would you recommend this person?
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-4">
        <Button type="submit" loading={loading} disabled={rating < 1}>
          {existingReview ? 'Update review' : 'Submit review'}
        </Button>
      </div>
    </form>
  );
}
