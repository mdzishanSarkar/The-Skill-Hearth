import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as challengeService from '../services/challenge';
import { asyncHandler } from '../utils/errors';

export const createChallenge = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, skillCategory, challengeType, goalDescription, goalTarget, startDate, endDate, badgeName, description, badgeIcon, maxParticipants } = req.body || {};
  if (!title || !skillCategory || !challengeType || !goalDescription || !goalTarget || !startDate || !endDate || !badgeName) {
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'title, skillCategory, challengeType, goalDescription, goalTarget, startDate, endDate, and badgeName are required',
      },
    });
    return;
  }
  const challenge = await challengeService.createChallenge({
    creatorId: req.userId!,
    title,
    description,
    skillCategory,
    challengeType,
    goalDescription,
    goalTarget: Number(goalTarget),
    startDate,
    endDate,
    badgeName,
    badgeIcon,
    maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
  });
  res.status(201).json({ success: true, data: { challenge } });
});

export const listChallenges = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, skillCategory, page, limit } = req.query;
  const result = await challengeService.listChallenges({
    status: status ? String(status) : undefined,
    skillCategory: skillCategory ? String(skillCategory) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json({ success: true, data: result });
});

export const getChallenge = asyncHandler(async (req: AuthRequest, res: Response) => {
  const challenge = await challengeService.getChallenge(String(req.params.id));
  res.json({ success: true, data: { challenge } });
});

export const joinChallenge = asyncHandler(async (req: AuthRequest, res: Response) => {
  const challenge = await challengeService.joinChallenge(String(req.params.id), req.userId!);
  res.json({ success: true, data: { challenge } });
});

export const updateProgress = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { progress } = req.body || {};
  if (progress === undefined) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'progress is required' },
    });
    return;
  }
  const challenge = await challengeService.updateProgress(
    String(req.params.id),
    req.userId!,
    Number(progress)
  );
  res.json({ success: true, data: { challenge } });
});

export const getLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const leaderboard = await challengeService.getLeaderboard(String(req.params.id));
  res.json({ success: true, data: { leaderboard } });
});
