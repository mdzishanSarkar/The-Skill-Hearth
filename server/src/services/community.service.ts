import { Types } from 'mongoose';
import { CommunityPost, User, Notification } from '../models';
import type { IUserVote } from '../models';
import { HttpError } from '../utils/errors';
import { moderateText, shouldFlagForReview, getFlagReason } from './contentModeration';

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

const URL_REGEX = /https?:\/\/[^\s]+/i;

export interface CreatePostInput {
  authorId: string;
  content: string;
  city: string;
  neighborhood?: string;
}

export async function createPost(input: CreatePostInput) {
  const authorId = toObjectId(input.authorId);

  const user = await User.findById(authorId).select('status isShadowBanned');
  if (!user || user.status !== 'active') {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }
  if (user.isShadowBanned) {
    throw new HttpError(403, 'FORBIDDEN', 'Your account cannot create posts');
  }

  const trimmed = input.content.trim();
  if (!trimmed) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'Content is required');
  }
  if (trimmed.length > 1000) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'Content must be 1000 characters or fewer');
  }
  if (URL_REGEX.test(trimmed)) {
    throw new HttpError(422, 'NO_LINKS_ALLOWED', 'External links are not allowed in community posts');
  }

  const moderation = await moderateText(trimmed);
  let isFlagged = false;
  let flagReason: string | null = null;
  if (shouldFlagForReview(moderation)) {
    isFlagged = true;
    flagReason = getFlagReason(moderation);
  }

  const city = input.city.trim().toLowerCase();
  if (!city) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'City is required');
  }

  const post = await CommunityPost.create({
    authorId,
    content: trimmed,
    city,
    neighborhood: input.neighborhood?.trim().toLowerCase() || undefined,
    isFlagged,
    flagReason: flagReason || undefined,
  });

  return post.toJSON();
}

export interface ListPostsQuery {
  city: string;
  neighborhood?: string;
  sort?: 'new' | 'top';
  page?: number;
  limit?: number;
  userId?: string;
}

export async function listPosts(query: ListPostsQuery) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const city = query.city.trim().toLowerCase();
  const filter: Record<string, unknown> = {
    city,
    isDeleted: false,
  };

  if (query.neighborhood) {
    filter.neighborhood = query.neighborhood.trim().toLowerCase();
  }

  const sortOptions: [string, 1 | -1][] = query.sort === 'top'
    ? [['voteScore', -1], ['createdAt', -1]]
    : [['createdAt', -1]];

  const [posts, total] = await Promise.all([
    CommunityPost.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'displayName avatar')
      .lean(),
    CommunityPost.countDocuments(filter),
  ]);

  const enriched = posts.map((post) => {
    const author = post.authorId as unknown as { _id: string; displayName: string; avatar: string } | null;
    let userVote: 'up' | 'down' | null = null;
    if (query.userId && post.userVotes) {
      const vote = post.userVotes.find(
        (v: IUserVote) => String(v.userId) === query.userId
      );
      userVote = vote?.vote ?? null;
    }
    return {
      ...post,
      author,
      userVote,
    };
  });

  return {
    posts: enriched,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getPost(postId: string, userId?: string) {
  const id = toObjectId(postId);
  const post = await CommunityPost.findOne({ _id: id, isDeleted: false })
    .populate('authorId', 'displayName avatar')
    .lean();

  if (!post) {
    throw new HttpError(404, 'POST_NOT_FOUND', 'Post not found');
  }

  let userVote: 'up' | 'down' | null = null;
  if (userId && post.userVotes) {
    const vote = post.userVotes.find(
      (v: IUserVote) => String(v.userId) === userId
    );
    userVote = vote?.vote ?? null;
  }

  const author = post.authorId as unknown as { _id: string; displayName: string; avatar: string } | null;
  return { ...post, author, userVote };
}

export async function deletePost(postId: string, userId: string) {
  const id = toObjectId(postId);
  const post = await CommunityPost.findOne({ _id: id, isDeleted: false });
  if (!post) {
    throw new HttpError(404, 'POST_NOT_FOUND', 'Post not found');
  }
  if (String(post.authorId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'You can only delete your own posts');
  }

  post.isDeleted = true;
  await post.save();
  return { success: true };
}

export async function votePost(
  postId: string,
  userId: string,
  vote: 'up' | 'down' | 'remove'
) {
  const id = toObjectId(postId);
  const userObjectId = toObjectId(userId);

  const post = await CommunityPost.findOne({ _id: id, isDeleted: false });
  if (!post) {
    throw new HttpError(404, 'POST_NOT_FOUND', 'Post not found');
  }
  if (String(post.authorId) === userId) {
    throw new HttpError(400, 'CANNOT_VOTE_OWN_POST', 'You cannot vote on your own post');
  }

  const existingIndex = post.userVotes.findIndex(
    (v: IUserVote) => String(v.userId) === userId
  );
  const existingVote = existingIndex >= 0 ? post.userVotes[existingIndex].vote : null;

  if (vote === 'remove') {
    if (existingIndex >= 0) {
      post.voteScore += existingVote === 'up' ? -1 : 1;
      post.userVotes.splice(existingIndex, 1);
    }
  } else if (existingIndex >= 0) {
    if (existingVote !== vote) {
      post.voteScore += vote === 'up' ? 2 : -2;
      post.userVotes[existingIndex].vote = vote;
    }
  } else {
    post.voteScore += vote === 'up' ? 1 : -1;
    post.userVotes.push({ userId: userObjectId, vote });
  }

  await post.save();
  return { voteScore: post.voteScore, userVote: vote === 'remove' ? null : vote };
}
