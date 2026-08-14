import { useEffect, useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { submitReview, updateReview } from '../../services/reviews';
import { getApiError } from '../../types/api.types';
import {
  MAX_REVIEW_LENGTH,
  MAX_REVIEW_TAGS,
  REVIEW_TAG_OPTIONS,
  type Review,
  type ReviewInput,
  type ReviewTag,
} from '../../types/review.types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface ReviewFormModalProps {
  open: boolean;
  onClose: () => void;
  connectionId: string;
  connectionTitle: string;
  mode: 'create' | 'edit';
  initial?: Review | null;
  onSubmitted: () => void;
}

function StarButton({
  value,
  active,
  onClick,
}: {
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded p-0.5 transition-transform hover:scale-110"
      aria-label={`${value} star${value > 1 ? 's' : ''}`}
    >
      <svg
        className={active ? 'h-8 w-8 text-amber-400' : 'h-8 w-8 text-gray-300 hover:text-amber-200'}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    </button>
  );
}

export default function ReviewFormModal({
  open,
  onClose,
  connectionId,
  connectionTitle,
  mode,
  initial,
  onSubmitted,
}: ReviewFormModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<ReviewTag[]>([]);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setRating(initial?.rating ?? 0);
    setContent(initial?.content ?? '');
    setTags(initial?.tags ?? []);
    setWouldRecommend(initial?.wouldRecommend ?? true);
    setError('');
    setSubmitting(false);
  }, [open, initial]);

  function toggleTag(tag: ReviewTag) {
    setTags((prev) => {
      if (prev.includes(tag)) return prev.filter((item) => item !== tag);
      if (prev.length >= MAX_REVIEW_TAGS) return prev;
      return [...prev, tag];
    });
  }

  async function handleSubmit() {
    if (submitting) return;
    if (rating < 1) {
      setError('Please select a star rating');
      return;
    }
    setSubmitting(true);
    setError('');
    const input: ReviewInput = { rating, content: content.trim(), tags, wouldRecommend };
    try {
      if (mode === 'edit' && initial) {
        await updateReview(initial._id, input);
        toast.success('Review updated');
      } else {
        await submitReview(connectionId, input);
        toast.success('Review submitted');
      }
      onSubmitted();
      onClose();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Edit your review' : 'Leave a review'}
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Share your experience with the session &quot;{connectionTitle}&quot;.
        </p>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Rating <span className="text-red-500 dark:text-red-400">*</span>
          </p>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <StarButton key={value} value={value} active={value <= rating} onClick={() => setRating(value)} />
            ))}
            {rating > 0 && <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{rating} / 5</span>}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="review-content" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your review <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
            </label>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {content.length}/{MAX_REVIEW_LENGTH}
            </span>
          </div>
          <textarea
            id="review-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={4}
            maxLength={MAX_REVIEW_LENGTH}
            placeholder="What went well? What was the experience like?"
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Tags <span className="font-normal text-gray-400 dark:text-gray-500">(up to {MAX_REVIEW_TAGS})</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TAG_OPTIONS.map((tag) => {
              const selected = tags.includes(tag);
              const disabled = !selected && tags.length >= MAX_REVIEW_TAGS;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  disabled={disabled}
                  className={clsx(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                    selected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40'
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Would you recommend them?</p>
          <div className="flex gap-2">
            {([true, false] as const).map((value) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setWouldRecommend(value)}
                className={clsx(
                  'rounded-md border px-4 py-1.5 text-sm font-medium transition-colors',
                  wouldRecommend === value
                    ? value
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300'
                      : 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                {value ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting} disabled={rating < 1}>
            {mode === 'edit' ? 'Save changes' : 'Submit review'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
