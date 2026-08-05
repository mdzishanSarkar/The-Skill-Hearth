import { Types } from 'mongoose';
import type { PipelineStage } from 'mongoose';
import { Skill } from '../models';
import { haversineKm } from '../utils/geo';

export type MapSkillType = 'teach' | 'learn';

export interface MapDiscoveryFilters {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  categoryIds?: string[];
  type?: MapSkillType;
  availability?: boolean;
  limit?: number;
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

export async function getMapPins(filters: MapDiscoveryFilters): Promise<MapPin[]> {
  const hasGeo = typeof filters.lat === 'number' && typeof filters.lng === 'number';
  const radiusKm = filters.radiusKm && filters.radiusKm > 0 ? filters.radiusKm : undefined;
  const limit = Math.min(MAX_PINS, Math.max(1, filters.limit || 100));

  const baseMatch: Record<string, unknown> = { isDeleted: false, isActive: true };
  if (filters.type === 'teach' || filters.type === 'learn') baseMatch.type = filters.type;
  if (filters.categoryIds && filters.categoryIds.length) {
    const validIds = filters.categoryIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (validIds.length) baseMatch.categoryId = { $in: validIds };
  }

  const pipeline: PipelineStage[] = [{ $match: baseMatch }];
  if (hasGeo && radiusKm) {
    pipeline.push({
      $match: {
        'location.coordinates': {
          $geoWithin: { $centerSphere: [[filters.lng!, filters.lat!], radiusKm / EARTH_RADIUS_KM] },
        },
      },
    });
  }
  pipeline.push(
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'teacher' } },
    { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: false } },
    { $match: { 'teacher.status': 'active', 'teacher.showOnMap': true } }
  );
  if (filters.availability) {
    pipeline.push({ $match: { 'teacher.availability.0': { $exists: true } } });
  }
  pipeline.push({ $limit: limit });

  const raw = await Skill.aggregate<Record<string, unknown>>(pipeline);

  return raw.map((item) => {
    const coords = (item.location as { coordinates?: number[] } | undefined)?.coordinates;
    const distanceKm =
      hasGeo && Array.isArray(coords) && coords.length === 2
        ? haversineKm([filters.lng!, filters.lat!], [coords[0], coords[1]])
        : undefined;
    const teacher = (item.teacher ?? {}) as Record<string, unknown>;
    const teacherStats = (teacher.stats ?? {}) as Record<string, unknown>;
    return {
      id: String(item._id),
      userId: String(item.userId),
      type: item.type as MapSkillType,
      categoryName: String(item.categoryName ?? ''),
      skillName: String(item.skillName ?? ''),
      format: String(item.format ?? 'either'),
      sessionLength: String(item.sessionLength ?? '1hr'),
      coordinates: (coords as [number, number]) ?? ([0, 0] as [number, number]),
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
