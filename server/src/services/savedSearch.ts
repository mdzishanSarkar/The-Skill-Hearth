import { Types } from 'mongoose';
import type { PipelineStage } from 'mongoose';
import { SavedSearch, Skill, User } from '../models';
import { HttpError } from '../utils/errors';

const EARTH_RADIUS_KM = 6378.1;

function pagination(page?: number, limit?: number) {
  const p = Math.max(1, page || 1);
  const l = Math.min(50, Math.max(1, limit || 10));
  return { page: p, limit: l, skip: (p - 1) * l };
}

export async function saveSearch(
  userId: string,
  name: string,
  filters: {
    category?: string;
    format?: string;
    type?: 'teach' | 'learn';
    radius?: number;
    availability?: string[];
    proficiencyLevel?: string;
  },
  alertEnabled = false,
) {
  if (!name.trim()) throw new HttpError(400, 'VALIDATION_ERROR', 'Search name is required');

  const search = await SavedSearch.create({
    userId,
    name: name.trim().slice(0, 60),
    filters,
    alertEnabled,
  });

  return search.toJSON();
}

export async function listSavedSearches(userId: string) {
  return SavedSearch.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function updateSavedSearch(
  searchId: string,
  userId: string,
  updates: { name?: string; alertEnabled?: boolean },
) {
  const search = await SavedSearch.findById(searchId);
  if (!search) throw new HttpError(404, 'NOT_FOUND', 'Saved search not found');
  if (String(search.userId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'Not your saved search');
  }

  if (updates.name !== undefined) search.name = updates.name.trim().slice(0, 60);
  if (updates.alertEnabled !== undefined) search.alertEnabled = updates.alertEnabled;
  await search.save();
  return search.toJSON();
}

export async function deleteSavedSearch(searchId: string, userId: string) {
  const result = await SavedSearch.deleteOne({ _id: searchId, userId });
  if (result.deletedCount === 0) {
    throw new HttpError(404, 'NOT_FOUND', 'Saved search not found');
  }
  return { success: true };
}

/** Shared skill match query for a saved search (used by both the matches endpoint and the alert job). */
export function buildSavedSearchMatch(
  search: { filters?: { category?: string; format?: string; type?: 'teach' | 'learn'; radius?: number; proficiencyLevel?: string } },
  userId: string,
): Record<string, unknown> {
  const match: Record<string, unknown> = {
    isDeleted: false,
    isActive: true,
    type: search.filters?.type || 'teach',
    userId: { $ne: userId },
  };
  if (search.filters?.category) match.categoryName = search.filters.category;
  if (search.filters?.format) match.format = search.filters.format;
  if (search.filters?.proficiencyLevel) match.proficiencyLevel = search.filters.proficiencyLevel;
  return match;
}

/** Restrict the match to the user's discovery radius if they have coordinates. */
export async function applyRadiusFilter(
  match: Record<string, unknown>,
  radiusKm: number | undefined,
  userId: string,
): Promise<void> {
  if (!radiusKm || radiusKm <= 0) return;
  const user = await User.findById(userId).select('location').lean();
  const coords = (user?.location as { coordinates?: number[] } | undefined)?.coordinates;
  if (coords && coords.length === 2) {
    match['location.coordinates'] = {
      $geoWithin: { $centerSphere: [[coords[0], coords[1]], radiusKm / EARTH_RADIUS_KM] },
    };
  }
}

export const TEACHER_LOOKUP: PipelineStage[] = [
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'teacher' } },
  { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: false } },
  { $match: { 'teacher.status': 'active' } },
];

export function mapSkill(raw: Record<string, unknown>, distanceMeters?: number) {
  const { __v, distanceMeters: _ignored, teacher, ...rest } = raw;
  const distanceKm =
    distanceMeters !== undefined ? Math.round((distanceMeters / 1000) * 10) / 10 : undefined;
  const mappedTeacher = teacher
    ? {
        _id: (teacher as Record<string, unknown>)._id,
        displayName: (teacher as Record<string, unknown>).displayName,
        avatar: (teacher as Record<string, unknown>).avatar,
        bio: (teacher as Record<string, unknown>).bio,
        location: (teacher as Record<string, unknown>).location,
        availability: (teacher as Record<string, unknown>).availability,
        stats: (teacher as Record<string, unknown>).stats,
        status: (teacher as Record<string, unknown>).status,
        lastActive: (teacher as Record<string, unknown>).lastActive,
        createdAt: (teacher as Record<string, unknown>).createdAt,
      }
    : undefined;
  return {
    ...rest,
    ...(distanceKm !== undefined ? { distanceKm } : {}),
    ...(mappedTeacher ? { teacher: mappedTeacher } : {}),
  };
}

/** Live matches for a saved search — paginated skills with their teachers. */
export async function getSearchMatches(
  searchId: string,
  userId: string,
  opts: { page?: number; limit?: number } = {},
) {
  if (!Types.ObjectId.isValid(searchId)) {
    throw new HttpError(404, 'NOT_FOUND', 'Saved search not found');
  }
  const search = await SavedSearch.findOne({ _id: searchId, userId }).lean();
  if (!search) throw new HttpError(404, 'NOT_FOUND', 'Saved search not found');

  const { page, limit, skip } = pagination(opts.page, opts.limit);
  const match = buildSavedSearchMatch(search, userId);
  await applyRadiusFilter(match, search.filters?.radius, userId);

  const pipeline: PipelineStage[] = [
    { $match: match },
    ...TEACHER_LOOKUP,
    { $facet: { meta: [{ $count: 'total' }], data: [{ $sort: { createdAt: -1 as const } }, { $skip: skip }, { $limit: limit }] } },
  ];

  const [result] = await Skill.aggregate<{ meta: { total: number }[]; data: Record<string, unknown>[] }>(pipeline);
  const total = result?.meta?.[0]?.total ?? 0;
  const skills = (result?.data ?? []).map((item) => mapSkill(item));

  return { skills, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
