import { Response } from 'express';
import { asyncHandler } from '../utils/errors';
import type { AuthRequest } from '../middleware/auth';
import * as reportService from '../services/report';
import type { ReportReason } from '../models/Report';

export const reportMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason, description } = req.body || {};
  const data = await reportService.submitReport({
    reporterId: String(req.userId),
    targetType: 'message',
    targetId: String(req.params.messageId),
    reason: reason as ReportReason,
    description: description ? String(description) : undefined,
  });
  res.status(201).json({ success: true, data });
});
