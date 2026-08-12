import { Response } from 'express';
import { asyncHandler } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import * as journalService from '../services/journal';

export const listEntries = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const result = await journalService.listEntries(req.userId!, page, limit);
  res.json({ success: true, data: result });
});

export const getEntry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const entry = await journalService.getEntry(req.userId!, String(req.params.entryId));
  res.json({ success: true, data: { entry } });
});

export const getConnectionEntries = asyncHandler(async (req: AuthRequest, res: Response) => {
  const entries = await journalService.listConnectionEntries(req.userId!, String(req.params.connectionId));
  res.json({ success: true, data: { entries } });
});

export const createEntry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const entry = await journalService.createEntry(req.userId!, String(req.body.connectionId), {
    prompt: req.body.prompt,
    content: req.body.content,
    mood: req.body.mood,
    isHighlighted: req.body.isHighlighted,
  });
  res.status(201).json({ success: true, data: { entry } });
});

export const updateEntry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const entry = await journalService.updateEntry(req.userId!, String(req.params.entryId), {
    prompt: req.body.prompt,
    content: req.body.content,
    mood: req.body.mood,
    isHighlighted: req.body.isHighlighted,
  });
  res.json({ success: true, data: { entry } });
});

export const deleteEntry = asyncHandler(async (req: AuthRequest, res: Response) => {
  await journalService.deleteEntry(req.userId!, String(req.params.entryId));
  res.status(204).end();
});
