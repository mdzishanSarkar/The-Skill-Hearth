import { Response } from 'express';
import { asyncHandler } from '../utils/errors';
import type { AuthRequest } from '../middleware/auth';
import * as notificationService from '../services/notification';

function paramId(value: unknown): string {
  return Array.isArray(value) ? value[0] : String(value);
}

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await notificationService.getNotifications(String(req.userId), page, limit);
  res.json({ success: true, data: result });
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await notificationService.markAsRead(paramId(req.params.id), String(req.userId));
  res.json({ success: true, data: result });
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await notificationService.markAllAsRead(String(req.userId));
  res.json({ success: true, data: result });
});

export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const count = await notificationService.getUnreadCount(String(req.userId));
  res.json({ success: true, data: { count } });
});
