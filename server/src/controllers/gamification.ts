import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as gamificationService from '../services/gamification';
import * as streakService from '../services/streak';
import { asyncHandler } from '../utils/errors';

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await gamificationService.getGamificationProfile(req.userId!);
  const streakStatus = await streakService.getStreakStatus(req.userId!);
  res.json({ success: true, data: { ...profile, streaks: streakStatus } });
});

export const getPublicProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await gamificationService.getPublicGamification(String(req.params.userId));
  res.json({ success: true, data: { profile } });
});

export const getLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { scope } = req.query;
  const board = await gamificationService.getLeaderboard(
    req.userId!,
    scope === 'global' ? 'global' : 'local',
  );
  res.json({ success: true, data: board });
});

export const useStreakFreeze = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type } = req.body;
  if (!['teaching', 'learning', 'logging'].includes(type)) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'type must be teaching, learning, or logging' } });
    return;
  }
  const streak = await streakService.useStreakFreeze(req.userId!, type);
  res.json({ success: true, data: { streak } });
});

export const getFriendsStreaks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const streaks = await streakService.getFriendsStreaks(req.userId!);
  res.json({ success: true, data: { streaks } });
});
