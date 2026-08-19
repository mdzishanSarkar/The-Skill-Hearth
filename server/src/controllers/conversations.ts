import { Response } from 'express';
import { asyncHandler, HttpError } from '../utils/errors';
import type { AuthRequest } from '../middleware/auth';
import * as conversationService from '../services/conversation.service';
import type { ConversationType } from '../services/conversation.service';

function paramId(value: unknown): string {
  return Array.isArray(value) ? value[0] : String(value);
}

function resolveType(value: unknown): ConversationType {
  return value === 'friend' ? 'friend' : 'skill';
}

export const listConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversations = await conversationService.getConversationList(String(req.userId));
  res.json({ success: true, data: { conversations } });
});

export const searchConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const query = String(req.query.q ?? '');
  const limit = Number(req.query.limit) || 20;
  const result = await conversationService.searchConversations({
    userId: String(req.userId),
    query,
    limit,
  });
  res.json({ success: true, data: result });
});

export const getConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversationId = paramId(req.params.id);
  const conversationType = resolveType(req.query.type);
  const conversations = await conversationService.getConversationList(String(req.userId));
  const conversation = conversations.find((c) => c.conversationId === conversationId && c.conversationType === conversationType);
  if (!conversation) {
    throw new HttpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
  }
  res.json({ success: true, data: conversation });
});

export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversationId = paramId(req.params.id);
  const conversationType = resolveType(req.query.type);
  const body = (req.body ?? {}) as Record<string, unknown>;

  const patch: Parameters<typeof conversationService.updateConversationSettings>[0]['patch'] = {};
  if (typeof body.isPinned === 'boolean') patch.isPinned = body.isPinned;
  if (typeof body.isMuted === 'boolean') patch.isMuted = body.isMuted;
  if (body.mutedUntil !== undefined && body.mutedUntil !== null) {
    patch.mutedUntil = new Date(String(body.mutedUntil));
  }
  if (typeof body.isArchived === 'boolean') patch.isArchived = body.isArchived;
  if (typeof body.customNickname === 'string') patch.customNickname = body.customNickname;
  if (typeof body.notificationOverride === 'string') {
    patch.notificationOverride = body.notificationOverride as 'default' | 'all' | 'mentions_only' | 'none';
  }
  if (typeof body.chatTheme === 'string') {
    patch.chatTheme = body.chatTheme as 'default' | 'sunset' | 'ocean' | 'forest' | 'midnight';
  }

  const result = await conversationService.updateConversationSettings({
    userId: String(req.userId),
    conversationId,
    conversationType,
    patch,
  });
  res.json({ success: true, data: result });
});

export const markRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversationId = paramId(req.params.id);
  const conversationType = resolveType(req.query.type);
  const lastReadMessageId = typeof req.body?.lastReadMessageId === 'string' ? req.body.lastReadMessageId : undefined;

  const result = await conversationService.markConversationRead({
    userId: String(req.userId),
    conversationId,
    conversationType,
    lastReadMessageId,
  });
  res.json({ success: true, data: result });
});

export const clearHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversationId = paramId(req.params.id);
  const conversationType = resolveType(req.query.type);
  const result = await conversationService.clearHistory({
    userId: String(req.userId),
    conversationId,
    conversationType,
  });
  res.json({ success: true, data: result });
});
