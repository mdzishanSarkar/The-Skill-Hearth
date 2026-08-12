import { Types } from 'mongoose';
import { Review, Connection, User, Skill } from '../models';
import type { ReviewTag } from '../models';
import { HttpError } from '../utils/errors';
import { awardXP } from './gamification';
import { createActivityEvent } from './activityFeed';

const VALID_TAGS: ReviewTag[] = [
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

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

export interface SubmitReviewInput {
  rating: number;
  content: string;
  tags: string[];
  wouldRecommend?: boolean;
}

export async function submitReview(reviewerId: string, connectionId: string, input: SubmitReviewInput) {
  const reviewerObjectId = toObjectId(reviewerId);
  const connObjectId = toObjectId(connectionId);

  const connection = await Connection.findById(connObjectId);
  if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found');
  if (connection.status !== 'completed') {
    throw new HttpError(400, 'NOT_COMPLETED', 'Reviews can only be left for completed sessions');
  }
  if (!connection.completedAt) {
    throw new HttpError(400, 'NOT_COMPLETED', 'Session not marked as completed');
  }

  const isParticipant =
    String(connection.requesterId) === reviewerId || String(connection.teacherId) === reviewerId;
  if (!isParticipant) {
    throw new HttpError(403, 'FORBIDDEN', 'Only session participants can leave reviews');
  }

  const revieweeId =
    String(connection.requesterId) === reviewerId
      ? String(connection.teacherId)
      : String(connection.requesterId);

  const existing = await Review.findOne({ connectionId: connObjectId, reviewerId: reviewerObjectId });
  if (existing) {
    throw new HttpError(409, 'ALREADY_REVIEWED', 'You have already reviewed this session');
  }

  const rating = Math.round(input.rating);
  if (rating < 1 || rating > 5) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Rating must be between 1 and 5');
  }

  const validTags = input.tags.filter((t) => (VALID_TAGS as string[]).includes(t)).slice(0, 10) as ReviewTag[];

  const review = await Review.create({
    connectionId: connObjectId,
    reviewerId: reviewerObjectId,
    revieweeId: new Types.ObjectId(revieweeId),
    skillId: connection.skillId,
    rating: rating as 1 | 2 | 3 | 4 | 5,
    content: input.content.trim().slice(0, 500),
    tags: validTags,
    wouldRecommend: input.wouldRecommend !== undefined ? input.wouldRecommend : true,
  });

  await recalculateUserRating(new Types.ObjectId(revieweeId));

  try {
    await awardXP(reviewerId, 'leave_review');
    await createActivityEvent({
      actorId: revieweeId,
      eventType: 'review_received',
      subjectType: 'review',
      subjectId: review._id,
      title: `Received a ${rating}-star review ⭐`,
      subtitle: 'Word travels at the hearth',
      emoji: rating >= 4 ? '🌟' : '⭐',
      visibility: 'public',
    });
  } catch {
    // best-effort
  }

  return review.toJSON() as unknown as Record<string, unknown>;
}

export async function updateReview(
  reviewerId: string,
  reviewId: string,
  input: SubmitReviewInput,
) {
  const reviewerObjectId = toObjectId(reviewerId);
  const reviewObjectId = toObjectId(reviewId);

  const review = await Review.findById(reviewObjectId);
  if (!review) throw new HttpError(404, 'REVIEW_NOT_FOUND', 'Review not found');
  if (String(review.reviewerId) !== reviewerId) {
    throw new HttpError(403, 'FORBIDDEN', 'You can only edit your own reviews');
  }

  const elapsed = Date.now() - new Date(review.createdAt).getTime();
  if (elapsed > EDIT_WINDOW_MS) {
    throw new HttpError(400, 'EDIT_WINDOW_CLOSED', 'Reviews cannot be edited after 24 hours');
  }

  const rating = Math.round(input.rating);
  if (rating < 1 || rating > 5) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Rating must be between 1 and 5');
  }

  const validTags = input.tags.filter((t) => (VALID_TAGS as string[]).includes(t)).slice(0, 10) as ReviewTag[];

  review.rating = rating as 1 | 2 | 3 | 4 | 5;
  review.content = input.content.trim().slice(0, 500);
  review.tags = validTags;
  if (input.wouldRecommend !== undefined) review.wouldRecommend = input.wouldRecommend;
  await review.save();

  await recalculateUserRating(review.revieweeId);

  return review.toJSON() as unknown as Record<string, unknown>;
}

export async function getMyConnectionReview(reviewerId: string, connectionId: string) {
  const review = await Review.findOne({
    connectionId: toObjectId(connectionId),
    reviewerId: toObjectId(reviewerId),
  }).lean();
  return review || null;
}

export async function getReviewableConnections(userId: string) {
  const userObjectId = toObjectId(userId);

  const completed = await Connection.find({
    status: 'completed',
    completedAt: { $exists: true, $ne: null },
    $or: [{ requesterId: userObjectId }, { teacherId: userObjectId }],
  })
    .sort({ completedAt: -1 })
    .populate('requesterId', 'displayName avatar')
    .populate('teacherId', 'displayName avatar')
    .populate('skillId', 'skillName categoryName')
    .lean();

  const connectionIds = completed.map((c) => c._id);
  const existingReviews = await Review.find({
    connectionId: { $in: connectionIds },
    reviewerId: userObjectId,
  })
    .select('connectionId')
    .lean();

  const reviewedIds = new Set(existingReviews.map((r) => r.connectionId.toString()));

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const reviewable = completed.filter((conn) => {
    const reviewed = reviewedIds.has(conn._id.toString());
    if (reviewed) return false;
    const completedAt = new Date(conn.completedAt!).getTime();
    if (now - completedAt > sevenDaysMs) return false;
    return true;
  });

  return reviewable;
}

export async function getUserReviews(userId: string, opts: { page?: number; limit?: number } = {}) {
  const page = Math.max(1, opts.page || 1);
  const limit = Math.min(50, Math.max(1, opts.limit || 5));
  const userObjectId = toObjectId(userId);

  const filter = { revieweeId: userObjectId };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('reviewerId', 'displayName avatar stats')
      .populate('skillId', 'skillName categoryName')
      .lean(),
    Review.countDocuments(filter),
  ]);

  return {
    reviews: reviews.map((r) => ({
      ...r,
      reviewer: r.reviewerId,
      skill: r.skillId,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

async function recalculateUserRating(userId: Types.ObjectId) {
  const [result] = await Review.aggregate<{ avg: number | null; count: number }>([
    { $match: { revieweeId: userId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        'stats.averageRating': result?.avg ?? 0,
        'stats.reviewCount': result?.count ?? 0,
      },
    },
  );
}
