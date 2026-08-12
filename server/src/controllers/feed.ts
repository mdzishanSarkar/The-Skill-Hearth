import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as feedService from '../services/activityFeed';
import { asyncHandler } from '../utils/errors';

export const getFeed = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit } = req.query;
  const feed = await feedService.getFeed(
    req.userId!,
    page ? Number(page) : 1,
    limit ? Number(limit) : 20,
  );
  res.json({ success: true, data: feed });
});

export const getUserFeed = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit } = req.query;
  const feed = await feedService.getUserActivityEvents(
    String(req.params.userId),
    req.userId!,
    page ? Number(page) : 1,
    limit ? Number(limit) : 20,
  );
  res.json({ success: true, data: feed });
});

export const reactToEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { emoji } = req.body;
  if (!emoji) {
    res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'emoji is required' } });
    return;
  }
  const event = await feedService.reactToEvent(String(req.params.eventId), req.userId!, emoji);
  res.json({ success: true, data: { event } });
});
