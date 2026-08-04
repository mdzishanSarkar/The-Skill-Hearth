import { Response } from 'express';
import { asyncHandler } from '../utils/errors';
import type { AuthRequest } from '../middleware/auth';
import * as reportService from '../services/report';
import type { ReportReason, ReportTargetType } from '../models/Report';

export const submitReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { targetType, targetId, reason, description } = req.body || {};
  const data = await reportService.submitReport({
    reporterId: String(req.userId),
    targetType: targetType as ReportTargetType,
    targetId: String(targetId),
    reason: reason as ReportReason,
    description: description ? String(description) : undefined,
  });
  res.status(201).json({ success: true, data });
});

export const listReports = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await reportService.listReports({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    targetType: typeof req.query.targetType === 'string' ? req.query.targetType : undefined,
  });
  res.json({ success: true, data });
});

export const getReportDetail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await reportService.getReportDetail(String(req.params.id));
  res.json({ success: true, data });
});

export const assignReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await reportService.assignReport(String(req.params.id), String(req.userId));
  res.json({ success: true, data });
});

export const resolveReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, action, resolution } = req.body || {};
  const data = await reportService.resolveReport(String(req.params.id), {
    status,
    action,
    resolution,
  });
  res.json({ success: true, data });
});
