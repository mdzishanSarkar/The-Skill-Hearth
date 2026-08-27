import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errors';
import type { AuthRequest } from '../middleware/auth';
import * as adminService from '../services/admin';
import * as reportService from '../services/report';
import * as moderationService from '../services/moderation';
import fs from 'fs';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const data = await adminService.listUsers({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    role: typeof req.query.role === 'string' ? req.query.role : undefined,
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
  });
  res.json({ success: true, data });
});

export const getUserDetail = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminService.getUserDetail(String(req.params.id));
  res.json({ success: true, data: { user } });
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, suspensionExpiresAt } = req.body || {};
  const user = await adminService.updateUserStatus(
    String(req.params.id),
    status,
    suspensionExpiresAt
  );
  res.json({ success: true, data: { user } });
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body || {};
  const user = await adminService.updateUserRole(String(req.params.id), role);
  res.json({ success: true, data: { user } });
});

export const reviewIdentity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { decision, rejectionReason } = req.body || {};
  const user = await adminService.reviewIdentity(
    String(req.params.id),
    String(req.userId),
    decision,
    rejectionReason
  );
  res.json({ success: true, data: { user } });
});

export const downloadIdentityDocument = asyncHandler(async (req: Request, res: Response) => {
  const filePath = await adminService.getIdentityDocumentPath(String(req.params.id));
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ success: false, error: { code: 'IDENTITY_DOCUMENT_NOT_FOUND', message: 'Identity document not found' } });
    return;
  }
  res.download(filePath, 'identity-document');
});

export const listReports = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportService.listReports({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    targetType: typeof req.query.targetType === 'string' ? req.query.targetType : undefined,
  });
  res.json({ success: true, data });
});

export const getReportDetail = asyncHandler(async (req: Request, res: Response) => {
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

export const warnUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason, reportId, resolution } = req.body || {};
  const data = await moderationService.warnUser(String(req.params.id), {
    adminId: String(req.userId),
    reason: reason ? String(reason) : undefined,
    reportId: reportId ? String(reportId) : undefined,
    resolution: resolution ? String(resolution) : undefined,
  });
  res.json({ success: true, data });
});

export const suspendUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { durationDays, reason, reportId, resolution } = req.body || {};
  const data = await moderationService.suspendUser(
    String(req.params.id),
    Number(durationDays) || 7,
    {
      adminId: String(req.userId),
      reason: reason ? String(reason) : undefined,
      reportId: reportId ? String(reportId) : undefined,
      resolution: resolution ? String(resolution) : undefined,
    }
  );
  res.json({ success: true, data });
});

export const banUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason, reportId, resolution } = req.body || {};
  const data = await moderationService.banUser(String(req.params.id), {
    adminId: String(req.userId),
    reason: reason ? String(reason) : undefined,
    reportId: reportId ? String(reportId) : undefined,
    resolution: resolution ? String(resolution) : undefined,
  });
  res.json({ success: true, data });
});

export const reactivateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await moderationService.reactivateUser(String(req.params.id), String(req.userId));
  res.json({ success: true, data });
});

export const removeSkill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason, reportId, resolution } = req.body || {};
  const data = await moderationService.removeSkill(String(req.params.id), {
    adminId: String(req.userId),
    reason: reason ? String(reason) : undefined,
    reportId: reportId ? String(reportId) : undefined,
    resolution: resolution ? String(resolution) : undefined,
  });
  res.json({ success: true, data });
});

export const removeReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason, reportId, resolution } = req.body || {};
  const data = await moderationService.removeReview(String(req.params.id), {
    adminId: String(req.userId),
    reason: reason ? String(reason) : undefined,
    reportId: reportId ? String(reportId) : undefined,
    resolution: resolution ? String(resolution) : undefined,
  });
  res.json({ success: true, data });
});

export const deleteMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason, reportId, resolution } = req.body || {};
  const data = await moderationService.deleteMessage(String(req.params.id), {
    adminId: String(req.userId),
    reason: reason ? String(reason) : undefined,
    reportId: reportId ? String(reportId) : undefined,
    resolution: resolution ? String(resolution) : undefined,
  });
  res.json({ success: true, data });
});

export const shadowBanUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason, reportId } = req.body || {};
  const data = await moderationService.shadowBanUser(String(req.params.id), {
    adminId: String(req.userId),
    reason: reason ? String(reason) : undefined,
    reportId: reportId ? String(reportId) : undefined,
  });
  res.json({ success: true, data });
});

export const removeShadowBan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body || {};
  const data = await moderationService.removeShadowBan(String(req.params.id), {
    adminId: String(req.userId),
    reason: reason ? String(reason) : undefined,
  });
  res.json({ success: true, data });
});

export const removePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason, reportId, resolution } = req.body || {};
  const data = await moderationService.removePost(String(req.params.id), {
    adminId: String(req.userId),
    reason: reason ? String(reason) : undefined,
    reportId: reportId ? String(reportId) : undefined,
    resolution: resolution ? String(resolution) : undefined,
  });
  res.json({ success: true, data });
});

export const detectSuspiciousActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await moderationService.detectSuspiciousActivity();
  res.json({ success: true, data: { flagged: data } });
});

export const getModerationStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await moderationService.getModerationStats();
  res.json({ success: true, data });
});
