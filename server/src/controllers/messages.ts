import { Response } from 'express';
import { asyncHandler, HttpError } from '../utils/errors';
import type { AuthRequest } from '../middleware/auth';
import * as messageService from '../services/message';
import * as reportService from '../services/report';
import type { ReportReason } from '../models/Report';

function paramId(value: unknown): string {
  return Array.isArray(value) ? value[0] : String(value);
}

export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { connectionId, content } = req.body || {};
  if (!connectionId || !content) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'connectionId and content are required');
  }
  const result = await messageService.sendMessage(
    String(connectionId),
    String(req.userId),
    String(content),
  );
  res.status(201).json({ success: true, data: result });
});

export const getMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const result = await messageService.getMessages(paramId(req.params.connectionId), String(req.userId), page, limit);
  res.json({ success: true, data: result });
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await messageService.markAsRead(paramId(req.params.connectionId), String(req.userId));
  res.json({ success: true, data: result });
});

export const markAsDelivered = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await messageService.markAsDelivered(paramId(req.params.messageId));
  res.json({ success: true, data: result });
});

export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const count = await messageService.getUnreadCount(String(req.userId));
  res.json({ success: true, data: { count } });
});

export const reportMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason, description } = req.body || {};
  const data = await reportService.submitReport({
    reporterId: String(req.userId),
    targetType: 'message',
    targetId: paramId(req.params.messageId),
    reason: reason as ReportReason,
    description: description ? String(description) : undefined,
  });
  res.status(201).json({ success: true, data });
});
