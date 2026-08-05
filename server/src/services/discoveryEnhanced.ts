import { Types } from 'mongoose';
import type { PipelineStage } from 'mongoose';
import { Skill, User, SavedSearch, LearnerRequest } from '../models';
import { HttpError } from '../utils/errors';
import { haversineKm } from '../utils/geo';

const EARTH_RADIUS_KM = 6378.1;

export interface NeighborhoodPage {
  city: string;
  neighborhood: string;
  skillCount: number;
  teacherCount: number;
  topCategories: Array<{ name: string; count: number }>;
  recentSkills: Array<Record<string, unknown>>;
}

export async function getNeighborhoodPage(city: string, neighborhood?: string) {
  const cityLower = city.toLowerCase().trim();
  const hoodLower = neighborhood?.toLowerCase().trim();

  const matchStage: Record<string, unknown> = {
    isDeleted: false,
    isActive: true,
    'location.city': cityLower,
  };
  if (hoodLower) matchStage['location.neighborhood'] = hoodLower;

  const pipeline: PipelineStage[] = [
    { $match: matchStage },
    {
      $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'teacher' },
    },
    { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: false } },
    { $match: { 'teacher.status': 'active' } },
    {
      $facet: {
        stats: [
          {
            $group: {
              _id: null,
              skillCount: { $sum: 1 },
              teacherIds: { $addToSet: '$userId' },
            },
          },
        ],
        categories: [
          { $group: { _id: '$categoryName', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ],
        recent: [
          { $sort: { createdAt: -1 } },
          { $limit: 6 },
          {
            $project: {
              _id: 1,
              skillName: 1,
              categoryName: 1,
              type: 1,
              format: 1,
              proficiencyLevel: 1,
              'stats.averageRating': 1,
              'stats.reviewCount': 1,
              teacher: { displayName: 1, avatar: 1 },
            },
          },
        ],
      },
    },
  ];

  const result = await Skill.aggregate(pipeline);
  const facet = result[0] || { stats: [], categories: [], recent: [] };

  const stats = facet.stats[0] || { skillCount: 0, teacherIds: [] };

  return {
    city: cityLower,
    neighborhood: hoodLower || '',
    skillCount: stats.skillCount,
    teacherCount: new Set(stats.teacherIds.map(String)).size,
    topCategories: facet.categories.map((c: Record<string, unknown>) => ({
      name: String(c._id),
      count: Number(c.count),
    })),
    recentSkills: facet.recent,
  };
}

export async function getNeighborhoodList() {
  const result = await Skill.aggregate([
    { $match: { isDeleted: false, isActive: true } },
    {
      $group: {
        _id: { city: '$location.city', neighborhood: '$location.neighborhood' },
        skillCount: { $sum: 1 },
      },
    },
    { $sort: { skillCount: -1 } },
    { $limit: 50 },
  ]);

  return result.map((r) => ({
    city: r._id.city,
    neighborhood: r._id.neighborhood,
    skillCount: r.skillCount,
  }));
}

export interface LearnerRequestInput {
  authorId: string;
  skillName: string;
  categoryName: string;
  description?: string;
  city: string;
  neighborhood?: string;
  format?: 'in-person' | 'online' | 'either';
  availability?: string[];
}

export async function createLearnerRequest(input: LearnerRequestInput) {
  const request = await LearnerRequest.create({
    authorId: input.authorId,
    skillName: input.skillName.trim(),
    categoryName: input.categoryName.trim(),
    description: (input.description || '').trim().slice(0, 1000),
    city: input.city.toLowerCase().trim(),
    neighborhood: input.neighborhood?.toLowerCase().trim(),
    format: input.format || 'either',
    availability: input.availability || [],
    status: 'open',
  });
  return request.toJSON();
}

export async function listLearnerRequests(
  page = 1,
  limit = 20,
  filters: { city?: string; categoryName?: string; format?: string } = {},
) {
  const match: Record<string, unknown> = { status: 'open' };
  if (filters.city) match.city = filters.city.toLowerCase().trim();
  if (filters.categoryName) match.categoryName = filters.categoryName.trim();
  if (filters.format) match.format = filters.format;

  const skip = (Math.max(1, page) - 1) * Math.min(50, Math.max(1, limit));

  const [requests, total] = await Promise.all([
    LearnerRequest.find(match)
      .populate('authorId', 'displayName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LearnerRequest.countDocuments(match),
  ]);

  return { requests, total, page, totalPages: Math.ceil(total / limit) };
}

export async function respondToLearnerRequest(requestId: string, teacherId: string) {
  const request = await LearnerRequest.findById(requestId);
  if (!request) throw new HttpError(404, 'NOT_FOUND', 'Request not found');
  if (request.status !== 'open') throw new HttpError(400, 'NOT_OPEN', 'Request is no longer open');
  if (String(request.authorId) === teacherId) {
    throw new HttpError(400, 'SELF_RESPONSE', 'Cannot respond to your own request');
  }

  request.responsesCount += 1;
  await request.save();

  const { Notification } = await import('../models');
  await Notification.create({
    userId: request.authorId,
    type: 'request_received',
    referenceId: request._id,
    referenceModel: 'LearnerRequest',
    message: `A teacher is interested in your request for "${request.skillName}"`,
  });

  return request.toJSON();
}

export async function closeLearnerRequest(requestId: string, userId: string) {
  const request = await LearnerRequest.findById(requestId);
  if (!request) throw new HttpError(404, 'NOT_FOUND', 'Request not found');
  if (String(request.authorId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'Only the author can close this request');
  }
  request.status = 'filled';
  await request.save();
  return request.toJSON();
}

export interface SmartMatch {
  userId: string;
  displayName: string;
  avatar: string;
  skillName: string;
  skillId: string;
  categoryName: string;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  format: string;
  matchScore: number;
}

export async function getSmartMatches(userId: string, limit = 10): Promise<SmartMatch[]> {
  const user = await User.findById(userId).lean();
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');

  const learnSkills = await Skill.find({
    userId,
    type: 'learn',
    isDeleted: false,
  }).lean();

  if (learnSkills.length === 0) return [];

  const skillNames = learnSkills.map((s) => s.skillName.toLowerCase());
  const [lng, lat] = user.location.coordinates;

  const hasGeo = lat !== 0 || lng !== 0;
  const maxRadius = user.location.radiusPreference || 10;

  const pipeline: PipelineStage[] = [
    {
      $match: {
        type: 'teach',
        isDeleted: false,
        isActive: true,
        skillName: { $in: skillNames.map((n) => new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) },
      },
    },
    {
      $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'teacher' },
    },
    { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: false } },
    { $match: { 'teacher.status': 'active', 'teacher._id': { $ne: new Types.ObjectId(userId) } } },
  ];

  if (hasGeo) {
    pipeline.push({
      $match: {
        'location.coordinates': {
          $geoWithin: { $centerSphere: [[lng, lat], maxRadius / EARTH_RADIUS_KM] },
        },
      },
    });
  }

  pipeline.push({ $limit: 100 });

  const raw = await Skill.aggregate(pipeline);

  const matches: SmartMatch[] = raw.map((item) => {
    const coords = (item.location as { coordinates?: number[] })?.coordinates;
    const distanceKm = hasGeo && coords
      ? haversineKm([lng, lat], [coords[0], coords[1]])
      : 999;
    const teacher = (item.teacher ?? {}) as Record<string, unknown>;
    const stats = (teacher.stats ?? {}) as Record<string, unknown>;
    const userAvail = user.availability || [];
    const teacherAvail = (teacher.availability as Array<{ day: string }>) || [];
    const availabilityOverlap = userAvail.filter((ua) =>
      teacherAvail.some((ta) => ta.day === ua.day),
    ).length;
    const avgRating = Number(stats.averageRating ?? 0);
    const distanceScore = Math.max(0, 1 - distanceKm / maxRadius);
    const availScore = Math.min(1, availabilityOverlap / 3);
    const ratingScore = avgRating / 5;
    const matchScore = (distanceScore * 0.3 + availScore * 0.3 + ratingScore * 0.4);

    return {
      userId: String(item.userId),
      displayName: String(teacher.displayName ?? ''),
      avatar: String(teacher.avatar ?? ''),
      skillName: String(item.skillName ?? ''),
      skillId: String(item._id),
      categoryName: String(item.categoryName ?? ''),
      distanceKm: Math.round(distanceKm * 10) / 10,
      rating: avgRating,
      reviewCount: Number(stats.reviewCount ?? 0),
      format: String(item.format ?? 'either'),
      matchScore: Math.round(matchScore * 100) / 100,
    };
  });

  matches.sort((a, b) => b.matchScore - a.matchScore);
  return matches.slice(0, limit);
}
