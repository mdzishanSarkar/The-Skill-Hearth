import { Response } from 'express';
import { User } from '../models';
import { AuthRequest } from '../middleware/auth';
import * as templateService from '../services/requestTemplate';
import { asyncHandler } from '../utils/errors';

export const listTemplates = asyncHandler(async (req: AuthRequest, res: Response) => {
  let isAdmin = false;
  if (req.userId) {
    const viewer = await User.findById(req.userId).select('role').lean();
    isAdmin = viewer?.role === 'admin';
  }
  const result = await templateService.listTemplates({
    categoryId: req.query.categoryId ? String(req.query.categoryId) : undefined,
    includeInactive: req.query.includeInactive === 'true',
    admin: isAdmin,
  });
  res.json({ success: true, data: result });
});

export const getTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const template = await templateService.getTemplate(String(req.params.id));
  res.json({ success: true, data: { template } });
});

export const createTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const template = await templateService.createTemplate(req.userId!, {
    title: req.body.title,
    intro: req.body.intro,
    body: req.body.body,
    categoryId: req.body.categoryId,
    categoryName: req.body.categoryName,
    isActive: req.body.isActive,
  });
  res.status(201).json({ success: true, data: { template } });
});

export const updateTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const template = await templateService.updateTemplate(String(req.params.id), {
    title: req.body.title,
    intro: req.body.intro,
    body: req.body.body,
    categoryId: req.body.categoryId,
    categoryName: req.body.categoryName,
    isActive: req.body.isActive,
  });
  res.json({ success: true, data: { template } });
});

export const deleteTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
  await templateService.deleteTemplate(String(req.params.id));
  res.status(204).end();
});
