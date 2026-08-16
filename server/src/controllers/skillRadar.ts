import { Response } from 'express';
import { asyncHandler } from '../utils/errors';
import type { AuthRequest } from '../middleware/auth';
import * as radarService from '../services/skillRadar.service';

const INTENT_STATUSES = ['active', 'paused', 'dismissed'];

export const getRadar = asyncHandler(async (req: AuthRequest, res: Response) => {
  const radar = await radarService.getRadarForUser(String(req.userId));
  res.json({
    success: true,
    data: radar ?? { userId: String(req.userId), intents: [], manualRadars: [], updatedAt: null },
  });
});

export const getIntents = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = String(req.userId);
  const radar = await radarService.getRadarForUser(userId);
  const intents = radar?.intents ?? [];
  const liveCounts = await radarService.countIntentMatches(userId);
  const enriched = intents.map((i) => ({
    ...i,
    matchCount: liveCounts[i.category] ?? i.matchCount ?? 0,
  }));
  res.json({ success: true, data: { intents: enriched } });
});

export const patchIntentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.body || {};
  const category = String(req.params.category ?? '').trim();
  if (!category) {
    res.status(400).json({ success: false, error: { code: 'MISSING_CATEGORY', message: 'category is required' } });
    return;
  }
  if (!INTENT_STATUSES.includes(status)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'status must be one of active, paused, dismissed' } });
    return;
  }
  await radarService.updateIntentStatus(String(req.userId), category, status);
  const intents = await radarService.getRadarForUser(String(req.userId));
  res.json({ success: true, data: { intents: intents?.intents ?? [] } });
});

export const postSignal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, category, skillName, format } = req.body || {};
  if (!type) {
    res.status(400).json({ success: false, error: { code: 'MISSING_TYPE', message: 'signal type is required' } });
    return;
  }
  await radarService.recordSignal(String(req.userId), { type, category, skillName, format });
  res.status(201).json({ success: true, data: { recorded: true } });
});

export const getIntentMatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 5;
  const skills = await radarService.getIntentMatches(
    String(req.userId),
    String(req.params.category ?? '').trim(),
    limit,
  );
  res.json({ success: true, data: { skills } });
});

export const postManual = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, filters } = req.body || {};
  const radar = await radarService.createManualRadar(String(req.userId), { name, filters });
  res.status(201).json({ success: true, data: { manualRadar: radar } });
});

export const deleteManual = asyncHandler(async (req: AuthRequest, res: Response) => {
  await radarService.deleteManualRadar(String(req.userId), String(req.params.id));
  res.json({ success: true, data: { deleted: true } });
});
