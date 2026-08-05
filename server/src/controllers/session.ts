import { Response } from 'express';
import { asyncHandler } from '../utils/errors';
import type { AuthRequest } from '../middleware/auth';
import * as sessionService from '../services/session';

function paramId(value: unknown): string {
  return Array.isArray(value) ? value[0] : String(value);
}

export const proposeSchedule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { proposedAt } = req.body || {};
  if (!proposedAt) {
    res.status(400).json({ success: false, error: { code: 'MISSING_TIME', message: 'proposedAt is required' } });
    return;
  }
  const result = await sessionService.proposeSchedule(paramId(req.params.id), String(req.userId), new Date(proposedAt));
  res.json({ success: true, data: result });
});

export const confirmSchedule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await sessionService.confirmSchedule(paramId(req.params.id), String(req.userId));
  res.json({ success: true, data: result });
});

export const downloadICS = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ics = await sessionService.generateICS(paramId(req.params.id), String(req.userId));
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="session.ics"');
  res.send(ics);
});

export const getSessionNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const note = await sessionService.getSessionNote(paramId(req.params.id), String(req.userId));
  res.json({ success: true, data: { note } });
});

export const updateSessionNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { content } = req.body || {};
  const note = await sessionService.updateSessionNote(paramId(req.params.id), String(req.userId), content || '');
  res.json({ success: true, data: { note } });
});

export const reportNoShow = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body || {};
  const result = await sessionService.reportNoShow(paramId(req.params.id), String(req.userId), reason);
  res.json({ success: true, data: result });
});
