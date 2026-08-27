import { Types } from 'mongoose';
import type { PipelineStage } from 'mongoose';
import { Category, Skill, Review, User } from '../models';
import { SKILL_TAXONOMY } from '../data/skillTaxonomy';
import { HttpError } from '../utils/errors';
import { haversineKm } from '../utils/geo';
import { awardXP, awardBadge } from './gamification';
import { createActivityEvent } from './activityFeed';

export type SkillType = 'teach' | 'learn';
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';
export type SessionFormat = 'in-person' | 'online' | 'either';
export type SessionLength = '30min' | '1hr' | '2hr+';

export interface SkillInput {
  type: SkillType;
  categoryId: string;
  skillName: string;
  description?: string;
  proficiencyLevel: ProficiencyLevel;
  format: SessionFormat;
  sessionLength: SessionLength;
  showOnMap: boolean;
}

export interface ListSkillsFilters {
  page?: number;
  limit?: number;
  type?: SkillType;
  categoryId?: string;
  format?: string;
  availability?: boolean;
  q?: string;
  sort?: 'newest' | 'most-reviewed' | 'closest';
  lat?: number;
  lng?: number;
  radiusKm?: number;
  userId?: string;
  excludeUserIds?: string[];
}

const VALID_TYPES: SkillType[] = ['teach', 'learn'];
const VALID_PROFICIENCY: ProficiencyLevel[] = ['beginner', 'intermediate', 'advanced'];
const VALID_FORMATS: SessionFormat[] = ['in-person', 'online', 'either'];
const VALID_LENGTHS: SessionLength[] = ['30min', '1hr', '2hr+'];

const EARTH_RADIUS_KM = 6378.1;

function pagination(page?: number, limit?: number) {
  const p = Math.max(1, page || 1);
  const l = Math.min(50, Math.max(1, limit || 20));
  return { page: p, limit: l, skip: (p - 1) * l };
}

export async function seedCategories(): Promise<void> {
  const operations = SKILL_TAXONOMY.map((category) => ({
    updateOne: {
      filter: { slug: category.slug },
      update: {
        $set: {
          name: category.name,
          icon: category.icon,
          description: category.description,
          displayOrder: category.displayOrder,
          isActive: true,
          skills: category.skills.map((skill) => ({
            name: skill.name,
            slug: skill.slug,
            description: skill.description,
            isActive: true,
          })),
        },
      },
      upsert: true,
    },
  }));
  await Category.bulkWrite(operations);
}

export async function listCategories() {
  const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 }).lean();
  return categories.map((category) => ({
    ...category,
    skills: category.skills.filter((skill) => skill.isActive),
  }));
}

async function loadCategory(categoryId: string) {
  if (!Types.ObjectId.isValid(categoryId)) {
    throw new HttpError(400, 'INVALID_CATEGORY', 'Unknown or inactive skill category');
  }
  const category = await Category.findOne({ _id: categoryId, isActive: true }).lean();
  if (!category) {
    throw new HttpError(400, 'INVALID_CATEGORY', 'Unknown or inactive skill category');
  }
  return category;
}

export async function createSkill(userId: string, input: SkillInput) {
  const { type, categoryId, skillName, description = '', proficiencyLevel, format, sessionLength, showOnMap = true } = input;

  if (!VALID_TYPES.includes(type)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Skill type must be "teach" or "learn"');
  }
  const trimmedName = (skillName || '').trim();
  if (!trimmedName) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Skill name is required');
  }
  if (trimmedName.length > 100) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Skill name must be 100 characters or fewer');
  }
  if (description.length > 500) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Description must be 500 characters or fewer');
  }
  if (!VALID_PROFICIENCY.includes(proficiencyLevel)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid proficiency level');
  }
  if (!VALID_FORMATS.includes(format)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid session format');
  }
  if (!VALID_LENGTHS.includes(sessionLength)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid session length');
  }

  const category = await loadCategory(categoryId);
  const user = await User.findById(userId).select('location').lean();
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const skill = await Skill.create({
    userId,
    type,
    categoryId: category._id,
    categoryName: category.name,
    skillName: trimmedName,
    description: description.trim(),
    proficiencyLevel,
    format,
    sessionLength,
    showOnMap: Boolean(showOnMap),
    isActive: true,
    isDeleted: false,
    location: {
      city: user.location.city,
      zipCode: user.location.zipCode,
      neighborhood: user.location.neighborhood,
      coordinates: user.location.coordinates,
      radiusPreference: user.location.radiusPreference,
    },
  });

  const isFirstSkill = (await Skill.countDocuments({ userId, isDeleted: false })) === 1;
  try {
    await awardXP(userId, isFirstSkill ? 'add_first_skill' : 'add_skill');
    if (isFirstSkill) await awardBadge(userId, 'first_spark');
    await createActivityEvent({
      actorId: userId,
      eventType: 'skill_added',
      subjectType: 'skill',
      subjectId: skill._id,
      title: `${isFirstSkill ? 'Added first skill' : 'Added skill'}: ${trimmedName} ${type === 'teach' ? '🧑‍🏫' : '🎯'}`,
      subtitle: `${category.name}`,
      emoji: type === 'teach' ? '🧑‍🏫' : '🎯',
      visibility: 'public',
    });
  } catch {
    // best-effort
  }

  return getSkillById(String(skill._id));
}

export async function listMySkills(
  userId: string,
  options: { type?: SkillType; page?: number; limit?: number }
) {
  const { page, limit, skip } = pagination(options.page, options.limit);
  const query: Record<string, unknown> = { userId, isDeleted: false };
  if (options.type === 'teach' || options.type === 'learn') {
    query.type = options.type;
  }

  const [total, skills] = await Promise.all([
    Skill.countDocuments(query),
    Skill.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  return { skills, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getSkillById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(404, 'SKILL_NOT_FOUND', 'Skill not found');
  }
  const skill = await Skill.findOne({ _id: id, isDeleted: false }).lean();
  if (!skill) {
    throw new HttpError(404, 'SKILL_NOT_FOUND', 'Skill not found');
  }
  const teacher = await User.findById(skill.userId).select('-email -passwordHash').lean();
  return { ...skill, teacher };
}

export async function updateSkill(userId: string, id: string, input: Partial<SkillInput>) {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(404, 'SKILL_NOT_FOUND', 'Skill not found');
  }
  const skill = await Skill.findOne({ _id: id, userId, isDeleted: false });
  if (!skill) {
    throw new HttpError(404, 'SKILL_NOT_FOUND', 'Skill not found');
  }

  if (input.skillName !== undefined) {
    const trimmedName = input.skillName.trim();
    if (!trimmedName) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Skill name is required');
    }
    if (trimmedName.length > 100) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Skill name must be 100 characters or fewer');
    }
    skill.skillName = trimmedName;
  }
  if (input.description !== undefined) {
    if (input.description.length > 500) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Description must be 500 characters or fewer');
    }
    skill.description = input.description.trim();
  }
  if (input.proficiencyLevel !== undefined) {
    if (!VALID_PROFICIENCY.includes(input.proficiencyLevel)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid proficiency level');
    }
    skill.proficiencyLevel = input.proficiencyLevel;
  }
  if (input.format !== undefined) {
    if (!VALID_FORMATS.includes(input.format)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid session format');
    }
    skill.format = input.format;
  }
  if (input.sessionLength !== undefined) {
    if (!VALID_LENGTHS.includes(input.sessionLength)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid session length');
    }
    skill.sessionLength = input.sessionLength;
  }
  if (input.showOnMap !== undefined) {
    skill.showOnMap = Boolean(input.showOnMap);
  }
  if (input.categoryId !== undefined) {
    const category = await loadCategory(input.categoryId);
    skill.categoryId = category._id;
    skill.categoryName = category.name;
  }

  await skill.save();
  return getSkillById(id);
}

export async function deleteSkill(userId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(404, 'SKILL_NOT_FOUND', 'Skill not found');
  }
  const skill = await Skill.findOne({ _id: id, userId, isDeleted: false });
  if (!skill) {
    throw new HttpError(404, 'SKILL_NOT_FOUND', 'Skill not found');
  }
  skill.isDeleted = true;
  skill.isActive = false;
  skill.deletedAt = new Date();
  await skill.save();
  return { success: true };
}

export async function toggleSkillActive(userId: string, id: string, isActive: boolean) {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(404, 'SKILL_NOT_FOUND', 'Skill not found');
  }
  const skill = await Skill.findOne({ _id: id, userId, isDeleted: false });
  if (!skill) {
    throw new HttpError(404, 'SKILL_NOT_FOUND', 'Skill not found');
  }
  skill.isActive = Boolean(isActive);
  await skill.save();
  return getSkillById(id);
}

const TEACHER_PROJECTION: Record<string, 1> = {
  _id: 1,
  displayName: 1,
  avatar: 1,
  bio: 1,
  location: 1,
  availability: 1,
  stats: 1,
  status: 1,
  lastActive: 1,
  createdAt: 1,
};

const TEACHER_LOOKUP: PipelineStage[] = [
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'teacher' } },
  { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: false } },
  { $match: { 'teacher.status': 'active' } },
];

function mapSkill(raw: Record<string, unknown>, distanceMeters?: number) {
  const { __v, distanceMeters: _ignored, teacher, ...rest } = raw as Record<string, unknown> & {
    teacher?: Record<string, unknown> | null;
  };
  const distanceKm =
    distanceMeters !== undefined ? Math.round((distanceMeters / 1000) * 10) / 10 : undefined;
  const mappedTeacher = teacher
    ? {
        _id: teacher._id,
        displayName: teacher.displayName,
        avatar: teacher.avatar,
        bio: teacher.bio,
        location: teacher.location,
        availability: teacher.availability,
        stats: teacher.stats,
        status: teacher.status,
        lastActive: teacher.lastActive,
        createdAt: teacher.createdAt,
      }
    : undefined;
  return {
    ...rest,
    ...(distanceKm !== undefined ? { distanceKm } : {}),
    ...(mappedTeacher ? { teacher: mappedTeacher } : {}),
  };
}

export async function listSkills(filters: ListSkillsFilters) {
  const { page, limit, skip } = pagination(filters.page, filters.limit);

  const baseMatch: Record<string, unknown> = { isDeleted: false, isActive: true };
  if (filters.type) baseMatch.type = filters.type;
  if (filters.categoryId && Types.ObjectId.isValid(filters.categoryId)) {
    baseMatch.categoryId = new Types.ObjectId(filters.categoryId);
  }
  if (filters.format) baseMatch.format = filters.format;
  if (filters.userId && Types.ObjectId.isValid(filters.userId)) {
    baseMatch.userId = new Types.ObjectId(filters.userId);
  }
  if (filters.excludeUserIds?.length) {
    const exclude = filters.excludeUserIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
    if (exclude.length) {
      const existing = baseMatch.userId;
      baseMatch.userId = existing
        ? { $nin: exclude, ...(typeof existing === 'object' ? existing : { $eq: existing }) }
        : { $nin: exclude };
    }
  }

  const q = (filters.q || '').trim().replace(/["\\]/g, ' ');
  if (q) baseMatch.$text = { $search: q };

  const hasGeo = typeof filters.lat === 'number' && typeof filters.lng === 'number';
  const radiusKm = filters.radiusKm && filters.radiusKm > 0 ? filters.radiusKm : undefined;
  const sort =
    filters.sort === 'closest' && hasGeo
      ? 'closest'
      : filters.sort === 'most-reviewed'
        ? 'most-reviewed'
        : 'newest';

  const availabilityMatch: PipelineStage[] = filters.availability
    ? [{ $match: { 'teacher.availability.0': { $exists: true } } }]
    : [];

  if (sort === 'closest') {
    const geoQuery = { ...baseMatch };
    delete geoQuery.$text;
    const lng = filters.lng!;
    const lat = filters.lat!;

    // $geoNear must be the first stage, and $text can only run as a leading $match.
    // Resolve text matches first, then restrict the geo query to those ids.
    if (baseMatch.$text) {
      const candidates = await Skill.aggregate<{ _id: unknown }>([
        { $match: baseMatch },
        { $project: { _id: 1 } },
        { $limit: 1000 },
      ]);
      const ids = candidates.map((c) => c._id);
      if (ids.length === 0) {
        return { skills: [], total: 0, page, limit, totalPages: 1 };
      }
      geoQuery._id = { $in: ids };
    }

    const pipeline: PipelineStage[] = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceMeters',
          spherical: true,
          key: 'location.coordinates',
          query: geoQuery,
        },
      },
      ...TEACHER_LOOKUP,
      ...availabilityMatch,
    ];
    if (radiusKm) {
      pipeline.push({ $match: { distanceMeters: { $lte: radiusKm * 1000 } } });
    }
    pipeline.push({ $sort: { distanceMeters: 1 } });

    const countResult = await Skill.aggregate<{ total: number }>([...pipeline, { $count: 'total' }]);
    const total = countResult[0]?.total ?? 0;

    const raw = await Skill.aggregate<Record<string, unknown>>([
      ...pipeline,
      { $skip: skip },
      { $limit: limit },
    ]);
    const skills = raw.map((item) => mapSkill(item, Number(item.distanceMeters)));

    return { skills, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
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
  pipeline.push(...TEACHER_LOOKUP);
  pipeline.push(...availabilityMatch);
  pipeline.push({
    $facet: {
      meta: [{ $count: 'total' }],
      data: [
        ...(sort === 'most-reviewed'
          ? [{ $sort: { 'stats.reviewCount': -1 as const, createdAt: -1 as const } }]
          : [{ $sort: { createdAt: -1 as const } }]),
        { $skip: skip },
        { $limit: limit },
      ],
    },
  });

  const [result] = await Skill.aggregate<{
    meta: { total: number }[];
    data: Record<string, unknown>[];
  }>(pipeline);
  const total = result?.meta[0]?.total ?? 0;
  const raw = result?.data ?? [];

  const skills = raw.map((item) => {
    const coords = item.location as { coordinates?: number[] } | undefined;
    const distanceMeters = hasGeo && coords?.coordinates?.length === 2
      ? haversineKm([filters.lng!, filters.lat!], [coords.coordinates[0], coords.coordinates[1]])
      : undefined;
    return mapSkill(item, distanceMeters);
  });

  return { skills, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function listSkillReviews(skillId: string) {
  if (!Types.ObjectId.isValid(skillId)) {
    throw new HttpError(404, 'SKILL_NOT_FOUND', 'Skill not found');
  }
  const reviews = await Review.find({ skillId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const reviewerIds = [...new Set(reviews.map((review) => review.reviewerId.toString()))];
  const reviewers = reviewerIds.length
    ? await User.find({ _id: { $in: reviewerIds } })
        .select('displayName avatar stats')
        .lean()
    : [];
  const reviewerMap = new Map(reviewers.map((user) => [user._id.toString(), user]));

  return reviews.map((review) => ({
    ...review,
    reviewer: reviewerMap.get(review.reviewerId.toString()) || null,
  }));
}
