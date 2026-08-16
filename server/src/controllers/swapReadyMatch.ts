import { Response } from 'express';
import { asyncHandler, HttpError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth';
import * as swapReadyMatchService from '../services/swapReadyMatch.service';

export const listMatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = Number(req.query.limit) || 50;
  const matches = await swapReadyMatchService.getAvailableMatches(req.userId!, limit);
  res.json({ success: true, data: { matches } });
});

export const propose = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.params.id) throw new HttpError(400, 'VALIDATION_ERROR', 'Match id is required');
  const result = await swapReadyMatchService.proposeMatch(String(req.params.id), req.userId!);
  res.status(201).json({ success: true, data: result });
});

export const hide = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.params.id) throw new HttpError(400, 'VALIDATION_ERROR', 'Match id is required');
  const result = await swapReadyMatchService.hideMatch(String(req.params.id), req.userId!);
  res.json({ success: true, data: result });
});
