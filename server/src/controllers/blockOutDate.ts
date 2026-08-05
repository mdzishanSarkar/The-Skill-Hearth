import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as blockOutService from '../services/blockOutDate';
import { asyncHandler } from '../utils/errors';

export const getBlockOutDates = asyncHandler(async (req: AuthRequest, res: Response) => {
  const dates = await blockOutService.getBlockOutDates(req.userId!);
  res.json({ success: true, data: { dates } });
});

export const addBlockOutDate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { date, reason } = req.body;
  if (!date) {
    res.status(400).json({ success: false, error: { code: 'MISSING_DATE', message: 'Date is required' } });
    return;
  }
  const blockOut = await blockOutService.addBlockOutDate(req.userId!, date, reason || '');
  res.status(201).json({ success: true, data: { date: blockOut } });
});

export const removeBlockOutDate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await blockOutService.removeBlockOutDate(req.userId!, String(req.params.id));
  res.json({ success: true, data: result });
});
