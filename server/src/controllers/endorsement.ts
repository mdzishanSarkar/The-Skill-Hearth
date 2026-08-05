import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as endorsementService from '../services/endorsement';
import { asyncHandler } from '../utils/errors';

export const endorse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { endorseeId, skillId, connectionId } = req.body;
  if (!endorseeId || !skillId || !connectionId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'endorseeId, skillId, and connectionId are required' } });
    return;
  }
  const endorsement = await endorsementService.endorseSkill(req.userId!, endorseeId, skillId, connectionId);
  res.status(201).json({ success: true, data: { endorsement } });
});

export const removeEndorsement = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await endorsementService.removeEndorsement(String(req.params.id), req.userId!);
  res.json({ success: true, data: result });
});

export const getSkillEndorsements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit } = req.query;
  const result = await endorsementService.getSkillEndorsements(
    String(req.params.skillId),
    page ? Number(page) : undefined,
    limit ? Number(limit) : undefined,
  );
  res.json({ success: true, data: result });
});

export const getUserEndorsements = asyncHandler(async (req: AuthRequest, res: Response) => {
  const endorsements = await endorsementService.getUserEndorsements(String(req.params.userId));
  res.json({ success: true, data: { endorsements } });
});

export const checkEndorsed = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { endorseeId, skillId } = req.query;
  const endorsed = await endorsementService.hasEndorsed(
    req.userId!,
    endorseeId as string,
    skillId as string,
  );
  res.json({ success: true, data: { endorsed } });
});
