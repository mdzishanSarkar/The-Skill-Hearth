import { Response } from 'express';
import { asyncHandler, HttpError } from '../utils/errors';
import type { AuthRequest } from '../middleware/auth';
import * as messageEnhanced from '../services/messageEnhanced';
import { uploadSkillImage } from '../utils/upload';

function paramId(value: unknown): string {
  return Array.isArray(value) ? value[0] : String(value);
}

export const sendImageMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No image uploaded' } });
    return;
  }

  const connectionId = req.body.connectionId || paramId(req.params.connectionId);
  if (!connectionId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_CONNECTION', message: 'connectionId is required' } });
    return;
  }

  const result = await uploadSkillImage(file.buffer, file.mimetype);
  if (!result) {
    throw new HttpError(500, 'UPLOAD_FAILED', 'Failed to upload image');
  }

  const message = await messageEnhanced.sendImageMessage(
    connectionId,
    String(req.userId),
    result.url,
    result.publicId,
    req.body.caption,
  );

  res.status(201).json({ success: true, data: message });
});

export const addReaction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { emoji } = req.body || {};
  if (!emoji) {
    res.status(400).json({ success: false, error: { code: 'MISSING_EMOJI', message: 'emoji is required' } });
    return;
  }
  const message = await messageEnhanced.addReaction(paramId(req.params.id), String(req.userId), emoji);
  res.json({ success: true, data: message });
});

export const searchMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, page, limit } = req.query;
  if (!q) {
    res.status(400).json({ success: false, error: { code: 'MISSING_QUERY', message: 'q query param is required' } });
    return;
  }
  const result = await messageEnhanced.searchMessages(
    paramId(req.params.connectionId),
    String(req.userId),
    String(q),
    page ? Number(page) : undefined,
    limit ? Number(limit) : undefined,
  );
  res.json({ success: true, data: result });
});
