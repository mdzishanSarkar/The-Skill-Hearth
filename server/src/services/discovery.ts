import { Types } from 'mongoose';
import type { PipelineStage } from 'mongoose';
import { Skill } from '../models';
import { haversineKm } from '../utils/geo';
import { getBlockedIds } from './block.service';

export type MapSkillType = 'teach' | 'learn';

export interface MapDiscoveryFilters {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  categoryIds?: string[];
  type?: MapSkillType;
  availability?: boolean;
  limit?: number;
  viewerId?: string;
}

export interface MapPinTeacher {
  _id: string;
  displayName: string;
  avatar: string;
  rating: number;
  reviewCount: number;
}

export interface MapPin {
  id: string;
  userId: string;
  type: MapSkillType;
  categoryName: string;
  skillName: string;
  format: string;
  sessionLength: string;
  coordinates: [number, number];
  distanceKm?: number;
  teacher: MapPinTeacher;
}

const EARTH_RADIUS_KM = 6378.1;
const MAX_PINS = 200;

function isValidCoords(coords: unknown): boolean {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lng, lat] = coords;
  return typeof lng === 'number' && typeof lat === 'number' && (lng !== 0 || lat !== 0);
}

export async function getMapPins(filters: MapDiscoveryFilters): Promise<MapPin[]> {
  const hasGeo = typeof filters.lat === 'number' && typeof filters.lng === 'number';
  const radiusKm = filters.radiusKm && filters.radiusKm > 0 ? filters.radiusKm : undefined;
  const limit = Math.min(MAX_PINS, Math.max(1, filters.limit || 100));

  const baseMatch: Record<string, unknown> = { isDeleted: false, isActive: true, showOnMap: { $ne: false } };
  if (filters.type === 'teach' || filters.type === 'learn') baseMatch.type = filters.type;
  if (filters.categoryIds && filters.categoryIds.length) {
    const validIds = filters.categoryIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (validIds.length) baseMatch.categoryId = { $in: validIds };
  }

  const pipeline: PipelineStage[] = [
    { $match: baseMatch },
    // Join with the skill's owner first to get user coordinates as fallback
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'teacher' } },
    { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: false } },
    { $match: { 'teacher.status': 'active', 'teacher.isShadowBanned': { $ne: true } } },
  ];

  // When geo filtering, use skill coords if valid, otherwise fall back to user coords
  if (hasGeo && radiusKm) {
    pipeline.push({
      $addFields: {
        _effectiveCoords: {
          $let: {
            vars: {
              skillCoords: '$location.coordinates',
              userCoords: '$teacher.location.coordinates',
            },
            in: {
              $cond: {
                if: {
                  $or: [
                    { $eq: [{ $arrayElemAt: ['$$skillCoords', 0] }, 0] },
                    { $eq: [{ $arrayElemAt: ['$$skillCoords', 1] }, 0] },
                  ],
                },
                then: '$$userCoords',
                else: '$$skillCoords',
              },
            },
          },
        },
      },
    });
    pipeline.push({
      $match: {
        _effectiveCoords: {
          $geoWithin: { $centerSphere: [[filters.lng!, filters.lat!], radiusKm / EARTH_RADIUS_KM] },
        },
      },
    });
  }

  if (filters.viewerId) {
    const blocked = (await getBlockedIds(filters.viewerId)).map((id) => new Types.ObjectId(id));
    if (blocked.length) {
      pipeline.push({ $match: { 'teacher._id': { $nin: blocked } } });
    }
  }
  if (filters.availability) {
    pipeline.push({ $match: { 'teacher.availability.0': { $exists: true } } });
  }
  pipeline.push({ $limit: limit });

  const raw = await Skill.aggregate<Record<string, unknown>>(pipeline);

  return raw.map((item) => {
    const skillCoords = (item.location as { coordinates?: number[] } | undefined)?.coordinates;
    const teacher = (item.teacher ?? {}) as Record<string, unknown>;
    const userCoords = (teacher.location as { coordinates?: number[] } | undefined)?.coordinates;
    // Use skill coords if valid, otherwise fall back to user coords
    const coords = isValidCoords(skillCoords) ? skillCoords : userCoords;
    const distanceKm =
      hasGeo && Array.isArray(coords) && coords.length === 2 && isValidCoords(coords)
        ? haversineKm([filters.lng!, filters.lat!], [coords[0], coords[1]])
        : undefined;
    const teacherStats = (teacher.stats ?? {}) as Record<string, unknown>;
    return {
      id: String(item._id),
      userId: String(item.userId),
      type: item.type as MapSkillType,
      categoryName: String(item.categoryName ?? ''),
      skillName: String(item.skillName ?? ''),
      format: String(item.format ?? 'either'),
      sessionLength: String(item.sessionLength ?? '1hr'),
      coordinates: (isValidCoords(coords) ? coords : [0, 0]) as [number, number],
      distanceKm: distanceKm !== undefined ? Math.max(0, Math.round(distanceKm * 10) / 10) : undefined,
      teacher: {
        _id: String(teacher._id ?? ''),
        displayName: String(teacher.displayName ?? ''),
        avatar: String(teacher.avatar ?? ''),
        rating: Number(teacherStats.averageRating ?? 0),
        reviewCount: Number(teacherStats.reviewCount ?? 0),
      },
    };
  });
}
