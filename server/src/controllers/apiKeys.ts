import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as publicApiService from '../services/publicApi';
import { asyncHandler } from '../utils/errors';

export const createApiKey = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, scopes, rateLimit, expiresAt } = req.body || {};
  if (!name) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'name is required' },
    });
    return;
  }
  const key = await publicApiService.createApiKey({
    ownerId: req.userId!,
    name,
    scopes,
    rateLimit,
    expiresAt,
  });
  res.status(201).json({ success: true, data: { apiKey: key } });
});

export const listApiKeys = asyncHandler(async (req: AuthRequest, res: Response) => {
  const keys = await publicApiService.listApiKeys(req.userId!);
  res.json({ success: true, data: { apiKeys: keys } });
});

export const revokeApiKey = asyncHandler(async (req: AuthRequest, res: Response) => {
  const key = await publicApiService.revokeApiKey(String(req.params.id), req.userId!);
  res.json({ success: true, data: { apiKey: key } });
});
