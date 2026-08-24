import { Response } from 'express';
import { asyncHandler, HttpError } from '../utils/errors';
import type { AuthRequest } from '../middleware/auth';
import * as conversationService from '../services/conversation.service';
import type { ConversationType } from '../services/conversation.service';
import * as reportService from '../services/report';
import type { ReportReason } from '../models/Report';
import { uploadChatImage } from '../utils/upload';
import { getIO } from '../config/socket';
import { checkRateLimit } from '../utils/rateLimit';

function paramId(value: unknown): string {
  return Array.isArray(value) ? value[0] : String(value);
}

function resolveType(value: unknown): ConversationType {
  return value === 'friend' ? 'friend' : 'skill';
}

export const getHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversationId = paramId(req.params.conversationId);
  const conversationType = resolveType(req.query.type);
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 30;

  const result = await conversationService.getConversationMessages({
    userId: String(req.userId),
    conversationId,
    conversationType,
    cursor,
    limit,
  });
  res.json({ success: true, data: result });
});

export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversationId = paramId(req.params.conversationId);
  const conversationType = resolveType(req.query.type);
  const { content, type, gifUrl, replyToMessageId } = (req.body ?? {}) as {
    content?: string;
    type?: 'text' | 'gif';
    gifUrl?: string;
    replyToMessageId?: string;
  };

  const rate = await checkRateLimit(`messenger:send:${req.userId}`, 30, 60);
  if (!rate.allowed) {
    res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many messages sent.', retryAfter: rate.retryAfterSeconds } });
    return;
  }

  const io = getIO();
  const { dto } = await conversationService.sendMessageAndNotify(io, {
    senderId: String(req.userId),
    conversationId,
    conversationType,
    content,
    type,
    gifUrl,
    replyToMessageId,
  });

  res.status(201).json({ success: true, data: dto });
});

export const sendImageMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversationId = paramId(req.params.conversationId);
  const conversationType = resolveType(req.query.type);
  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No image uploaded' } });
    return;
  }

  const rate = await checkRateLimit(`messenger:image:${req.userId}`, 20, 60 * 60);
  if (!rate.allowed) {
    res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many image uploads. Try again later.' } });
    return;
  }

  const uploaded = await uploadChatImage(file.buffer, file.mimetype);
  if (!uploaded) {
    throw new HttpError(500, 'UPLOAD_FAILED', 'Image upload service is unavailable');
  }

  const caption = typeof req.body?.caption === 'string' ? req.body.caption.slice(0, 500) : '';
  const io = getIO();

  const imageMessage = await conversationService.createImageMessage({
    senderId: String(req.userId),
    conversationId,
    conversationType,
    caption,
    imageUrl: uploaded.url,
    imageThumbnailUrl: uploaded.thumbnailUrl,
    imagePublicId: uploaded.publicId,
    imageWidth: uploaded.width,
    imageHeight: uploaded.height,
  });

  const context = await conversationService.getConversationContext(String(req.userId), conversationId, conversationType);
  for (const roomId of context.roomIds) {
    io.to(roomId).emit('messenger:message_received', { message: imageMessage });
  }
  for (const participantId of context.participantIds) {
    if (participantId !== String(req.userId)) {
      io.to(`user_${participantId}`).emit('messenger:message_received', { message: imageMessage });
    }
  }
  await conversationService.publishConversationUpdated(io, context.participantIds, conversationId);
  await conversationService.publishUnreadTotals(io, context.participantIds);

  res.status(201).json({ success: true, data: imageMessage });
});

export const editMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await conversationService.editMessage({
    userId: String(req.userId),
    messageId: paramId(req.params.messageId),
    content: String(req.body?.content ?? ''),
  });
  res.json({ success: true, data: result });
});

export const deleteMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await conversationService.deleteMessage({
    userId: String(req.userId),
    messageId: paramId(req.params.messageId),
  });
  res.json({ success: true, data: result });
});

export const toggleReaction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { emoji } = (req.body ?? {}) as { emoji?: string };
  if (!emoji) {
    throw new HttpError(400, 'MISSING_EMOJI', 'emoji is required');
  }
  const rate = await checkRateLimit(`messenger:react:${req.userId}`, 60, 60);
  if (!rate.allowed) {
    res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many reactions.', retryAfter: rate.retryAfterSeconds } });
    return;
  }
  const result = await conversationService.addReaction({
    userId: String(req.userId),
    messageId: paramId(req.params.messageId),
    emoji: emoji as never,
  });
  const io = getIO();
  const context = await conversationService.getConversationContext(String(req.userId), result.conversationId, result.conversationType);
  for (const roomId of context.roomIds) {
    io.to(roomId).emit('messenger:reaction_updated', {
      messageId: result.messageId,
      reactions: result.reactions,
    });
  }
  res.json({ success: true, data: result });
});

export const removeReaction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { emoji } = (req.body ?? {}) as { emoji?: string };
  if (!emoji) {
    throw new HttpError(400, 'MISSING_EMOJI', 'emoji is required');
  }
  const result = await conversationService.removeReaction({
    userId: String(req.userId),
    messageId: paramId(req.params.messageId),
    emoji: emoji as never,
  });
  const io = getIO();
  const context = await conversationService.getConversationContext(String(req.userId), result.conversationId, result.conversationType);
  for (const roomId of context.roomIds) {
    io.to(roomId).emit('messenger:reaction_updated', {
      messageId: result.messageId,
      reactions: result.reactions,
    });
  }
  res.json({ success: true, data: result });
});

export const reportMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason, description } = (req.body ?? {}) as { reason?: string; description?: string };
  const data = await reportService.submitReport({
    reporterId: String(req.userId),
    targetType: 'message',
    targetId: paramId(req.params.messageId),
    reason: reason as ReportReason,
    description: description ? String(description).slice(0, 1000) : undefined,
  });
  res.status(201).json({ success: true, data });
});

export const getMedia = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await conversationService.getMediaGallery({
    userId: String(req.userId),
    conversationId: paramId(req.params.conversationId),
    conversationType: resolveType(req.query.type),
    cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  });
  res.json({ success: true, data: result });
});

export const searchMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q ?? '');
  const result = await conversationService.searchInConversation({
    userId: String(req.userId),
    conversationId: paramId(req.params.conversationId),
    conversationType: resolveType(req.query.type),
    query: q,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  });
  res.json({ success: true, data: result });
});
