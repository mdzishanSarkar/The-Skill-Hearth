import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import * as skillService from '../services/skill';
import { AuthRequest } from '../middleware/auth';
import { Skill } from '../models';
import { HttpError } from '../utils/errors';
import { uploadSkillImage } from '../utils/upload';

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await skillService.listCategories();
  res.json({ success: true, data: { categories } });
});

export const createSkill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const skill = await skillService.createSkill(req.userId!, req.body || {});
  res.status(201).json({ success: true, data: { skill } });
});

export const listMySkills = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await skillService.listMySkills(req.userId!, {
    type: req.query.type as skillService.SkillType | undefined,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
  });
  res.json({ success: true, data });
});

export const getSkill = asyncHandler(async (req: Request, res: Response) => {
  const skill = await skillService.getSkillById(String(req.params.id));
  res.json({ success: true, data: { skill } });
});

export const updateSkill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const skill = await skillService.updateSkill(req.userId!, String(req.params.id), req.body || {});
  res.json({ success: true, data: { skill } });
});

export const deleteSkill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await skillService.deleteSkill(req.userId!, String(req.params.id));
  res.json({ success: true, data: result });
});

export const toggleSkill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const skill = await skillService.toggleSkillActive(
    req.userId!,
    String(req.params.id),
    Boolean(req.body?.isActive)
  );
  res.json({ success: true, data: { skill } });
});

export const listSkills = asyncHandler(async (req: Request, res: Response) => {
  const data = await skillService.listSkills({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    type: req.query.type as skillService.SkillType | undefined,
    categoryId: typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined,
    format: typeof req.query.format === 'string' ? req.query.format : undefined,
    availability:
      req.query.availability === 'true' || req.query.availability === '1',
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    sort: typeof req.query.sort === 'string'
      ? (req.query.sort as skillService.ListSkillsFilters['sort'])
      : undefined,
    lat: req.query.lat !== undefined ? Number(req.query.lat) : undefined,
    lng: req.query.lng !== undefined ? Number(req.query.lng) : undefined,
    radiusKm: req.query.radiusKm !== undefined ? Number(req.query.radiusKm) : undefined,
    userId: typeof req.query.userId === 'string' ? req.query.userId : undefined,
  });
  res.json({ success: true, data });
});

export const listSkillReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await skillService.listSkillReviews(String(req.params.id));
  res.json({ success: true, data: { reviews } });
});

export const addSkillMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No image uploaded' } });
    return;
  }

  const skill = await Skill.findOne({ _id: req.params.id, userId: req.userId!, isDeleted: false });
  if (!skill) {
    throw new HttpError(404, 'NOT_FOUND', 'Skill not found');
  }

  if (skill.media.length >= 5) {
    throw new HttpError(400, 'MEDIA_LIMIT', 'Maximum 5 images per skill');
  }

  const result = await uploadSkillImage(file.buffer, file.mimetype);
  if (!result) {
    throw new HttpError(500, 'UPLOAD_FAILED', 'Failed to upload image');
  }

  skill.media.push({ url: result.url, publicId: result.publicId });
  await skill.save();

  res.json({ success: true, data: { media: skill.media } });
});

export const removeSkillMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const skill = await Skill.findOne({ _id: req.params.id, userId: req.userId!, isDeleted: false });
  if (!skill) {
    throw new HttpError(404, 'NOT_FOUND', 'Skill not found');
  }

  const mediaIndex = skill.media.findIndex((m) => m.publicId === req.params.mediaId);
  if (mediaIndex === -1) {
    throw new HttpError(404, 'NOT_FOUND', 'Media not found');
  }

  const removed = skill.media.splice(mediaIndex, 1)[0];
  await skill.save();

  if (removed.publicId) {
    const { destroyCloudinaryImage } = await import('../config/cloudinary');
    await destroyCloudinaryImage(removed.publicId);
  }

  res.json({ success: true, data: { media: skill.media } });
});
