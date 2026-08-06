import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as blockService from '../services/block.service';
import { asyncHandler } from '../utils/errors';

export const blockUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await blockService.blockUser(req.userId!, String(req.params.userId));
  res.json({ success: true, data: result });
});

export const unblockUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await blockService.unblockUser(req.userId!, String(req.params.userId));
  res.json({ success: true, data: result });
});

export const getBlockedUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await blockService.getBlockedUsers(req.userId!);
  res.json({ success: true, data: result });
});
