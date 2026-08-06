import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as showcaseService from '../services/showcase';
import { asyncHandler } from '../utils/errors';

export const createShowcase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { skillId, title, description, media } = req.body || {};
  if (!title || !description) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'title and description are required' },
    });
    return;
  }
  const showcase = await showcaseService.createShowcase({
    userId: req.userId!,
    skillId,
    title,
    description,
    media,
  });
  res.status(201).json({ success: true, data: { showcase } });
});

export const listShowcases = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, page, limit } = req.query;
  const result = await showcaseService.listShowcases({
    userId: userId ? String(userId) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json({ success: true, data: result });
});

export const getShowcase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const showcase = await showcaseService.getShowcase(String(req.params.id));
  res.json({ success: true, data: { showcase } });
});

export const likeShowcase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await showcaseService.likeShowcase(String(req.params.id), req.userId!);
  res.json({ success: true, data: result });
});

export const deleteShowcase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await showcaseService.deleteShowcase(String(req.params.id), req.userId!);
  res.json({ success: true, data: result });
});
