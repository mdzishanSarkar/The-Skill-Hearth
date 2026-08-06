import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as courseService from '../services/course';
import { asyncHandler } from '../utils/errors';

export const createCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { skillId, title, description, sessions, maxEnrollments } = req.body || {};
  if (!skillId || !title || !sessions) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'skillId, title, and sessions are required' },
    });
    return;
  }
  if (!Array.isArray(sessions) || sessions.length < 3 || sessions.length > 6) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'sessions must be an array of 3 to 6 items' },
    });
    return;
  }
  const course = await courseService.createCourse({
    teacherId: req.userId!,
    skillId,
    title,
    description,
    sessions,
    maxEnrollments,
  });
  res.status(201).json({ success: true, data: { course } });
});

export const listCourses = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { teacherId, skillId, status, page, limit } = req.query;
  const result = await courseService.listCourses({
    teacherId: teacherId ? String(teacherId) : undefined,
    skillId: skillId ? String(skillId) : undefined,
    status: status ? String(status) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json({ success: true, data: result });
});

export const getCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const course = await courseService.getCourse(String(req.params.id));
  res.json({ success: true, data: { course } });
});

export const enrollInCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const enrollment = await courseService.enrollInCourse(String(req.params.id), req.userId!);
  res.status(201).json({ success: true, data: { enrollment } });
});

export const completeSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sessionIndex, notes } = req.body || {};
  if (sessionIndex === undefined) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'sessionIndex is required' },
    });
    return;
  }
  const enrollment = await courseService.completeSession(
    String(req.params.id),
    req.userId!,
    Number(sessionIndex),
    notes
  );
  res.json({ success: true, data: { enrollment } });
});

export const getMyEnrollments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status } = req.query;
  const enrollments = await courseService.getMyEnrollments(
    req.userId!,
    status ? String(status) : undefined
  );
  res.json({ success: true, data: { enrollments } });
});

export const updateCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, status } = req.body || {};
  const course = await courseService.updateCourse(String(req.params.id), req.userId!, {
    title,
    description,
    status,
  });
  res.json({ success: true, data: { course } });
});
