import { Response } from 'express';
import { asyncHandler, HttpError } from '../utils/errors';
import type { AuthRequest } from '../middleware/auth';
import * as connectionService from '../services/connection';

function paramId(value: unknown): string {
  return Array.isArray(value) ? value[0] : String(value);
}

export const sendRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { teacherId, skillId, message, proposedFormat } = req.body || {};
  if (!teacherId || !skillId || !message || !proposedFormat) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'teacherId, skillId, message, and proposedFormat are required');
  }
  const result = await connectionService.sendRequest({
    requesterId: String(req.userId),
    teacherId: String(teacherId),
    skillId: String(skillId),
    message: String(message),
    proposedFormat: proposedFormat as 'in-person' | 'online' | 'either',
  });
  res.status(201).json({ success: true, data: result });
});

export const respondToRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { action, responseMessage } = req.body || {};
  if (action !== 'accepted' && action !== 'rejected') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'action must be "accepted" or "rejected"');
  }
  const result = await connectionService.respondToRequest(
    paramId(req.params.id),
    String(req.userId),
    action,
    responseMessage ? String(responseMessage) : undefined,
  );
  res.json({ success: true, data: result });
});

export const withdrawRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await connectionService.withdrawRequest(paramId(req.params.id), String(req.userId));
  res.json({ success: true, data: result });
});

export const cancelConnection = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body || {};
  const result = await connectionService.cancelConnection(
    paramId(req.params.id),
    String(req.userId),
    reason ? String(reason) : undefined,
  );
  res.json({ success: true, data: result });
});

export const markCompleted = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await connectionService.markCompleted(paramId(req.params.id), String(req.userId));
  res.json({ success: true, data: result });
});

export const getConnection = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await connectionService.getConnection(paramId(req.params.id), String(req.userId));
  res.json({ success: true, data: result });
});

export const getInbox = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await connectionService.getInbox(String(req.userId), page, limit);
  res.json({ success: true, data: result });
});

export const getOutbox = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const result = await connectionService.getOutbox(String(req.userId), page, limit);
  res.json({ success: true, data: result });
});

export const getActiveChats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await connectionService.getActiveChats(String(req.userId));
  res.json({ success: true, data: result });
});
