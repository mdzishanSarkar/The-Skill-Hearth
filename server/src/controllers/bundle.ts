import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as bundleService from '../services/bundle';
import { asyncHandler } from '../utils/errors';

export const createBundle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, skillIds } = req.body;
  if (!name || !skillIds || !Array.isArray(skillIds)) {
    res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'name and skillIds are required' } });
    return;
  }
  const bundle = await bundleService.createBundle(req.userId!, name, description || '', skillIds);
  res.status(201).json({ success: true, data: { bundle } });
});

export const listBundles = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, sort } = req.query;
  const result = await bundleService.listBundles(
    page ? Number(page) : undefined,
    limit ? Number(limit) : undefined,
    sort as 'newest' | 'popular',
  );
  res.json({ success: true, data: result });
});

export const getBundle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const bundle = await bundleService.getBundle(String(req.params.id));
  res.json({ success: true, data: { bundle } });
});

export const voteOnBundle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await bundleService.voteOnBundle(String(req.params.id), req.userId!);
  res.json({ success: true, data: result });
});

export const deleteBundle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await bundleService.deleteBundle(String(req.params.id), req.userId!);
  res.json({ success: true, data: result });
});
