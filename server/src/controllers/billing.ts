import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as billingService from '../services/billing';
import { asyncHandler } from '../utils/errors';

export const createTip = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { payeeId, connectionId, amount } = req.body || {};
  if (!payeeId || !connectionId || !amount) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'payeeId, connectionId, and amount are required' },
    });
    return;
  }
  const result = await billingService.createTip({
    payerId: req.userId!,
    payeeId: String(payeeId),
    connectionId: String(connectionId),
    amount: Number(amount),
  });
  res.status(201).json({ success: true, data: result });
});

export const confirmTip = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await billingService.confirmTipPayment(String(req.params.id));
  res.json({ success: true, data: { tip: result } });
});

export const promoteSkill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { skillId, duration } = req.body || {};
  if (!skillId || ![7, 30].includes(Number(duration))) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'skillId and duration (7 or 30) are required' },
    });
    return;
  }
  const result = await billingService.promoteSkill(req.userId!, String(skillId), Number(duration) as 7 | 30);
  res.json({ success: true, data: result });
});

export const getImpactReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const report = await billingService.getImpactReport(req.userId!);
  res.json({ success: true, data: report });
});
