import { Types } from 'mongoose';
import { Mentorship, Skill, User } from '../models';
import { HttpError } from '../utils/errors';
import { createNotification } from './notification';

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

export interface CreateMentorshipInput {
  mentorId: string;
  menteeId: string;
  skillId: string;
  goals?: Array<{ title: string; description?: string; targetDate?: string }>;
  durationMonths?: number;
  meetingFrequency?: 'weekly' | 'biweekly' | 'monthly';
}

export async function requestMentorship(input: CreateMentorshipInput) {
  if (input.mentorId === input.menteeId) {
    throw new HttpError(400, 'CANNOT_MENTOR_SELF', 'You cannot mentor yourself');
  }

  const skill = await Skill.findOne({ _id: toObjectId(input.skillId), isDeleted: false });
  if (!skill) throw new HttpError(404, 'SKILL_NOT_FOUND', 'Skill not found');

  const existing = await Mentorship.findOne({
    mentorId: toObjectId(input.mentorId),
    menteeId: toObjectId(input.menteeId),
    skillId: toObjectId(input.skillId),
    status: { $in: ['pending', 'active'] },
  });
  if (existing) {
    throw new HttpError(409, 'ALREADY_EXISTS', 'A mentorship already exists for this pair and skill');
  }

  const mentorship = await Mentorship.create({
    mentorId: toObjectId(input.mentorId),
    menteeId: toObjectId(input.menteeId),
    skillId: toObjectId(input.skillId),
    goals: input.goals?.map((g) => ({
      title: g.title,
      description: g.description || '',
      targetDate: g.targetDate ? new Date(g.targetDate) : undefined,
    })) || [],
    durationMonths: input.durationMonths || 3,
    meetingFrequency: input.meetingFrequency || 'biweekly',
    targetEndDate: new Date(Date.now() + (input.durationMonths || 3) * 30 * 24 * 60 * 60 * 1000),
  });

  await createNotification({
    userId: toObjectId(input.mentorId),
    type: 'system_warning',
    referenceId: mentorship._id,
    referenceModel: 'Mentorship',
    message: 'You have a new mentorship request',
  });

  return mentorship.toJSON();
}

export async function respondToMentorship(
  mentorshipId: string,
  userId: string,
  action: 'accept' | 'reject'
) {
  const mentorship = await Mentorship.findById(toObjectId(mentorshipId));
  if (!mentorship) throw new HttpError(404, 'MENTORSHIP_NOT_FOUND', 'Mentorship not found');
  if (String(mentorship.mentorId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'Only the mentor can respond');
  }
  if (mentorship.status !== 'pending') {
    throw new HttpError(400, 'INVALID_STATE', 'Cannot respond to this mentorship');
  }

  mentorship.status = action === 'accept' ? 'active' : 'cancelled';
  await mentorship.save();

  await createNotification({
    userId: mentorship.menteeId,
    type: action === 'accept' ? 'system_warning' : 'system_warning',
    referenceId: mentorship._id,
    referenceModel: 'Mentorship',
    message: action === 'accept'
      ? 'Your mentorship request was accepted!'
      : 'Your mentorship request was declined.',
  });

  return mentorship.toJSON();
}

export async function addCheckIn(
  mentorshipId: string,
  userId: string,
  notes: string,
  mentorNotes?: string
) {
  const mentorship = await Mentorship.findById(toObjectId(mentorshipId));
  if (!mentorship) throw new HttpError(404, 'MENTORSHIP_NOT_FOUND', 'Mentorship not found');

  const isParticipant =
    String(mentorship.mentorId) === userId || String(mentorship.menteeId) === userId;
  if (!isParticipant) throw new HttpError(403, 'FORBIDDEN', 'Not a participant');

  if (mentorship.status !== 'active') {
    throw new HttpError(400, 'INVALID_STATE', 'Mentorship is not active');
  }

  mentorship.checkIns.push({
    date: new Date(),
    notes: notes.slice(0, 500),
    mentorNotes: mentorNotes?.slice(0, 500),
  });
  await mentorship.save();

  return mentorship.toJSON();
}

export async function updateGoal(
  mentorshipId: string,
  userId: string,
  goalIndex: number,
  completed: boolean
) {
  const mentorship = await Mentorship.findById(toObjectId(mentorshipId));
  if (!mentorship) throw new HttpError(404, 'MENTORSHIP_NOT_FOUND', 'Mentorship not found');

  const isParticipant =
    String(mentorship.mentorId) === userId || String(mentorship.menteeId) === userId;
  if (!isParticipant) throw new HttpError(403, 'FORBIDDEN', 'Not a participant');

  const goal = mentorship.goals[goalIndex];
  if (!goal) throw new HttpError(404, 'GOAL_NOT_FOUND', 'Goal not found');

  goal.completed = completed;
  goal.completedAt = completed ? new Date() : undefined;
  await mentorship.save();

  return mentorship.toJSON();
}

export async function completeMentorship(mentorshipId: string, userId: string) {
  const mentorship = await Mentorship.findById(toObjectId(mentorshipId));
  if (!mentorship) throw new HttpError(404, 'MENTORSHIP_NOT_FOUND', 'Mentorship not found');
  if (String(mentorship.mentorId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'Only the mentor can complete');
  }
  if (mentorship.status !== 'active') {
    throw new HttpError(400, 'INVALID_STATE', 'Mentorship is not active');
  }

  mentorship.status = 'completed';
  mentorship.completedAt = new Date();
  await mentorship.save();

  for (const uid of [mentorship.mentorId, mentorship.menteeId]) {
    await createNotification({
      userId: uid,
      type: 'system_warning',
      referenceId: mentorship._id,
      referenceModel: 'Mentorship',
      message: 'The mentorship has been completed!',
    });
  }

  return mentorship.toJSON();
}

export async function getMyMentorships(userId: string, as: 'mentor' | 'mentee') {
  const filter: Record<string, unknown> = {
    [as === 'mentor' ? 'mentorId' : 'menteeId']: toObjectId(userId),
    status: { $in: ['pending', 'active', 'paused'] },
  };

  return Mentorship.find(filter)
    .populate('mentorId', 'displayName avatar')
    .populate('menteeId', 'displayName avatar')
    .populate('skillId', 'skillName categoryName')
    .sort({ createdAt: -1 })
    .lean();
}
