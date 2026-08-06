import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as mentorshipService from '../services/mentorship';
import { asyncHandler } from '../utils/errors';

export const requestMentorship = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mentorId, skillId, goals, durationMonths, meetingFrequency } = req.body || {};
  if (!mentorId || !skillId) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'mentorId and skillId are required' },
    });
    return;
  }
  const mentorship = await mentorshipService.requestMentorship({
    mentorId,
    menteeId: req.userId!,
    skillId,
    goals,
    durationMonths: durationMonths ? Number(durationMonths) : undefined,
    meetingFrequency,
  });
  res.status(201).json({ success: true, data: { mentorship } });
});

export const respondToMentorship = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { action } = req.body || {};
  if (!action || !['accept', 'reject'].includes(action)) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'action must be "accept" or "reject"' },
    });
    return;
  }
  const mentorship = await mentorshipService.respondToMentorship(
    String(req.params.id),
    req.userId!,
    action
  );
  res.json({ success: true, data: { mentorship } });
});

export const addCheckIn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { notes, mentorNotes } = req.body || {};
  if (!notes) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'notes are required' },
    });
    return;
  }
  const mentorship = await mentorshipService.addCheckIn(
    String(req.params.id),
    req.userId!,
    notes,
    mentorNotes
  );
  res.json({ success: true, data: { mentorship } });
});

export const updateGoal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { goalIndex, completed } = req.body || {};
  if (goalIndex === undefined || completed === undefined) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'goalIndex and completed are required' },
    });
    return;
  }
  const mentorship = await mentorshipService.updateGoal(
    String(req.params.id),
    req.userId!,
    Number(goalIndex),
    Boolean(completed)
  );
  res.json({ success: true, data: { mentorship } });
});

export const completeMentorship = asyncHandler(async (req: AuthRequest, res: Response) => {
  const mentorship = await mentorshipService.completeMentorship(String(req.params.id), req.userId!);
  res.json({ success: true, data: { mentorship } });
});

export const getMyMentorships = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { as } = req.query;
  if (!as || !['mentor', 'mentee'].includes(String(as))) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'as query parameter must be "mentor" or "mentee"' },
    });
    return;
  }
  const mentorships = await mentorshipService.getMyMentorships(
    req.userId!,
    as as 'mentor' | 'mentee'
  );
  res.json({ success: true, data: { mentorships } });
});
