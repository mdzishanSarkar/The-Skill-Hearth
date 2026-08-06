import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as groupSessionService from '../services/groupSession';
import { asyncHandler } from '../utils/errors';

export const createSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { skillId, title, description, maxParticipants, format, location, scheduledAt, sessionType } = req.body || {};
  if (!skillId || !title || !format) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'skillId, title, and format are required' },
    });
    return;
  }
  const session = await groupSessionService.createSession({
    teacherId: req.userId!,
    skillId: String(skillId),
    title: String(title),
    description: description ? String(description) : undefined,
    maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
    format: String(format) as 'in-person' | 'online' | 'either',
    location: location ? String(location) : undefined,
    scheduledAt: scheduledAt ? String(scheduledAt) : undefined,
    sessionType: sessionType ? String(sessionType) as 'regular' | 'workshop' : undefined,
  });
  res.status(201).json({ success: true, data: { session } });
});

export const listSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { city, category, status, sessionType, sort, page, limit } = req.query;
  const result = await groupSessionService.listSessions({
    city: city ? String(city) : undefined,
    category: category ? String(category) : undefined,
    status: status ? String(status) : undefined,
    sessionType: sessionType ? String(sessionType) : undefined,
    sort: sort === 'scheduled' ? 'scheduled' : 'new',
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json({ success: true, data: result });
});

export const getSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const session = await groupSessionService.getSession(String(req.params.id));
  res.json({ success: true, data: { session } });
});

export const joinSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { message } = req.body || {};
  const result = await groupSessionService.joinSession(String(req.params.id), req.userId!);
  res.json({ success: true, data: result });
});

export const leaveSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await groupSessionService.leaveSession(String(req.params.id), req.userId!);
  res.json({ success: true, data: result });
});

export const completeSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await groupSessionService.completeSession(String(req.params.id), req.userId!);
  res.json({ success: true, data: { session: result } });
});

export const cancelSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { reason } = req.body || {};
  const result = await groupSessionService.cancelSession(
    String(req.params.id),
    req.userId!,
    reason ? String(reason) : undefined
  );
  res.json({ success: true, data: { session: result } });
});

export const updateSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, scheduledAt, location } = req.body || {};
  const result = await groupSessionService.updateSession(
    String(req.params.id),
    req.userId!,
    {
      title: title ? String(title) : undefined,
      description: description ? String(description) : undefined,
      scheduledAt: scheduledAt ? String(scheduledAt) : undefined,
      location: location ? String(location) : undefined,
    }
  );
  res.json({ success: true, data: { session: result } });
});
