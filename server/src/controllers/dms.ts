import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as dmService from '../services/friendDm';
import { asyncHandler } from '../utils/errors';

export const getConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversations = await dmService.getConversations(req.userId!);
  res.json({ success: true, data: { conversations } });
});

export const getConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit } = req.query;
  const conversation = await dmService.getConversation(
    req.userId!,
    String(req.params.userId),
    page ? Number(page) : 1,
    limit ? Number(limit) : 50,
  );
  res.json({ success: true, data: conversation });
});

export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content) {
    res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'content is required' } });
    return;
  }
  const message = await dmService.sendDirectMessage(req.userId!, String(req.params.userId), content);
  res.status(201).json({ success: true, data: { message } });
});

export const markRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await dmService.markConversationRead(req.userId!, String(req.params.userId));
  res.json({ success: true, data: result });
});

export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const count = await dmService.getUnreadDmCount(req.userId!);
  res.json({ success: true, data: { count } });
});
