import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as swapService from '../services/swap';
import { asyncHandler } from '../utils/errors';
import { signalSwapDeclined } from '../services/radarSignals';

export const getSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const suggestions = await swapService.findSwapSuggestions(req.userId!);
  res.json({ success: true, data: { suggestions } });
});

export const createSwap = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userBId, userATeachesSkillId, userBTeachesSkillId } = req.body;
  if (!userBId || !userATeachesSkillId || !userBTeachesSkillId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'userBId, userATeachesSkillId, and userBTeachesSkillId are required' } });
    return;
  }
  const swap = await swapService.createSwap(req.userId!, userBId, userATeachesSkillId, userBTeachesSkillId);
  res.status(201).json({ success: true, data: { swap } });
});

export const acceptSwap = asyncHandler(async (req: AuthRequest, res: Response) => {
  const swap = await swapService.acceptSwap(String(req.params.id), req.userId!);
  res.json({ success: true, data: { swap } });
});

export const declineSwap = asyncHandler(async (req: AuthRequest, res: Response) => {
  const swap = await swapService.declineSwap(String(req.params.id), req.userId!);
  signalSwapDeclined(req.userId, swap);
  res.json({ success: true, data: { swap } });
});

export const listSwaps = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  const swaps = await swapService.listUserSwaps(req.userId!, status as string);
  res.json({ success: true, data: { swaps } });
});
