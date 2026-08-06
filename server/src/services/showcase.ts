import { Types } from 'mongoose';
import { Showcase, User } from '../models';
import { HttpError } from '../utils/errors';

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

export interface CreateShowcaseInput {
  userId: string;
  skillId?: string;
  title: string;
  description: string;
  media?: Array<{ url: string; publicId: string; caption?: string }>;
}

export async function createShowcase(input: CreateShowcaseInput) {
  const showcase = await Showcase.create({
    userId: toObjectId(input.userId),
    skillId: input.skillId ? toObjectId(input.skillId) : undefined,
    title: input.title.trim(),
    description: input.description.trim(),
    media: input.media || [],
  });

  return showcase.toJSON();
}

export async function listShowcases(query: {
  userId?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { isDeleted: false };
  if (query.userId) filter.userId = toObjectId(query.userId);

  const [showcases, total] = await Promise.all([
    Showcase.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'displayName avatar')
      .populate('skillId', 'skillName categoryName')
      .lean(),
    Showcase.countDocuments(filter),
  ]);

  return { showcases, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

export async function getShowcase(showcaseId: string) {
  const showcase = await Showcase.findOne({ _id: toObjectId(showcaseId), isDeleted: false })
    .populate('userId', 'displayName avatar stats')
    .populate('skillId', 'skillName categoryName')
    .lean();
  if (!showcase) throw new HttpError(404, 'SHOWCASE_NOT_FOUND', 'Showcase not found');
  return showcase;
}

export async function likeShowcase(showcaseId: string, userId: string) {
  const showcase = await Showcase.findOne({ _id: toObjectId(showcaseId), isDeleted: false });
  if (!showcase) throw new HttpError(404, 'SHOWCASE_NOT_FOUND', 'Showcase not found');

  const existingIndex = showcase.likes.findIndex(
    (l) => String(l.userId) === userId
  );

  if (existingIndex >= 0) {
    showcase.likes.splice(existingIndex, 1);
    showcase.likeCount = Math.max(0, showcase.likeCount - 1);
  } else {
    showcase.likes.push({ userId: toObjectId(userId), createdAt: new Date() });
    showcase.likeCount += 1;
  }

  await showcase.save();
  return { likeCount: showcase.likeCount, liked: existingIndex < 0 };
}

export async function deleteShowcase(showcaseId: string, userId: string) {
  const showcase = await Showcase.findOne({ _id: toObjectId(showcaseId), isDeleted: false });
  if (!showcase) throw new HttpError(404, 'SHOWCASE_NOT_FOUND', 'Showcase not found');
  if (String(showcase.userId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'You can only delete your own showcases');
  }

  showcase.isDeleted = true;
  await showcase.save();
  return { success: true };
}
