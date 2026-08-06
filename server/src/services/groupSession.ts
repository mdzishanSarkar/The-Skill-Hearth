import { Types } from 'mongoose';
import { GroupSession, Skill, User, Notification, Message } from '../models';
import type { GroupSessionStatus } from '../models';
import { HttpError } from '../utils/errors';
import { moderateText, shouldFlagForReview, getFlagReason } from './contentModeration';

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

function generateChatRoomId(): string {
  return `group_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const VALID_TRANSITIONS: Record<GroupSessionStatus, GroupSessionStatus[]> = {
  open: ['full', 'completed', 'cancelled'],
  full: ['open', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export interface CreateSessionInput {
  teacherId: string;
  skillId: string;
  title: string;
  description?: string;
  maxParticipants?: number;
  format: 'in-person' | 'online' | 'either';
  location?: string;
  scheduledAt?: string;
  sessionType?: 'regular' | 'workshop';
}

export async function createSession(input: CreateSessionInput) {
  const teacherId = toObjectId(input.teacherId);
  const skillId = toObjectId(input.skillId);

  const user = await User.findById(teacherId).select('status isShadowBanned');
  if (!user || user.status !== 'active') {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }
  if (user.isShadowBanned) {
    throw new HttpError(403, 'FORBIDDEN', 'Your account cannot create group sessions');
  }

  const skill = await Skill.findOne({ _id: skillId, userId: teacherId, isDeleted: false });
  if (!skill) {
    throw new HttpError(404, 'SKILL_NOT_FOUND', 'Skill not found or does not belong to you');
  }

  const trimmed = input.title.trim();
  if (!trimmed) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'Title is required');
  }

  const textToModerate = `${trimmed} ${input.description || ''}`;
  const moderation = await moderateText(textToModerate);
  let isFlagged = false;
  let flagReason: string | null = null;
  if (shouldFlagForReview(moderation)) {
    isFlagged = true;
    flagReason = getFlagReason(moderation);
  }

  const maxParticipants = Math.min(20, Math.max(2, input.maxParticipants || 5));

  const session = await GroupSession.create({
    teacherId,
    skillId,
    title: trimmed,
    description: input.description?.trim().slice(0, 500) || '',
    maxParticipants,
    participants: [],
    format: input.format,
    location: input.location?.trim().slice(0, 200) || undefined,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    sessionType: input.sessionType || 'regular',
    status: 'open',
    chatRoomId: generateChatRoomId(),
    isFlagged,
    flagReason: flagReason || undefined,
  });

  return session.toJSON();
}

export interface ListSessionsQuery {
  city?: string;
  category?: string;
  status?: string;
  sessionType?: string;
  sort?: 'new' | 'scheduled';
  page?: number;
  limit?: number;
}

export async function listSessions(query: ListSessionsQuery) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (query.status && ['open', 'full', 'completed', 'cancelled'].includes(query.status)) {
    filter.status = query.status;
  } else {
    filter.status = { $in: ['open', 'full'] };
  }

  if (query.sessionType) {
    filter.sessionType = query.sessionType;
  }

  if (query.city) {
    const teacherIds = (
      await User.find({
        'location.city': query.city.trim().toLowerCase(),
        status: 'active',
      }).select('_id')
    ).map((u) => u._id);
    filter.teacherId = { $in: teacherIds };
  }

  if (query.category) {
    const skillIds = (
      await Skill.find({
        categoryName: query.category,
        isDeleted: false,
      }).select('_id')
    ).map((s) => s._id);
    filter.skillId = { $in: skillIds };
  }

  const sortOptions: [string, 1 | -1][] = query.sort === 'scheduled'
    ? [['scheduledAt', 1]]
    : [['createdAt', -1]];

  const [sessions, total] = await Promise.all([
    GroupSession.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('teacherId', 'displayName avatar')
      .populate('skillId', 'skillName categoryName')
      .populate('participants', 'displayName avatar')
      .lean(),
    GroupSession.countDocuments(filter),
  ]);

  return {
    sessions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getSession(sessionId: string) {
  const id = toObjectId(sessionId);
  const session = await GroupSession.findOne({ _id: id })
    .populate('teacherId', 'displayName avatar stats')
    .populate('skillId', 'skillName categoryName description')
    .populate('participants', 'displayName avatar')
    .lean();

  if (!session) {
    throw new HttpError(404, 'SESSION_NOT_FOUND', 'Group session not found');
  }

  return session;
}

export async function joinSession(sessionId: string, userId: string) {
  const id = toObjectId(sessionId);
  const userObjectId = toObjectId(userId);

  const user = await User.findById(userObjectId).select('status isShadowBanned');
  if (!user || user.status !== 'active') {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }
  if (user.isShadowBanned) {
    throw new HttpError(403, 'FORBIDDEN', 'Your account cannot join group sessions');
  }

  const session = await GroupSession.findById(id);
  if (!session) {
    throw new HttpError(404, 'SESSION_NOT_FOUND', 'Group session not found');
  }
  if (String(session.teacherId) === userId) {
    throw new HttpError(400, 'CANNOT_JOIN_OWN_SESSION', 'You cannot join your own group session');
  }
  if (session.status === 'cancelled' || session.status === 'completed') {
    throw new HttpError(400, 'SESSION_CLOSED', 'This session is no longer available');
  }
  if (session.participants.some((p) => String(p) === userId)) {
    throw new HttpError(409, 'ALREADY_JOINED', 'You have already joined this session');
  }
  if (session.participants.length >= session.maxParticipants) {
    throw new HttpError(400, 'SESSION_FULL', 'This session is full');
  }

  session.participants.push(userObjectId);
  if (session.participants.length >= session.maxParticipants) {
    session.status = 'full';
  }
  await session.save();

  await Notification.create({
    userId: session.teacherId,
    type: 'system_warning',
    referenceId: session._id,
    referenceModel: 'GroupSession',
    message: `${user.displayName} joined your group session "${session.title}"`,
  });

  return { session: session.toJSON(), chatRoomId: session.chatRoomId };
}

export async function leaveSession(sessionId: string, userId: string) {
  const id = toObjectId(sessionId);
  const session = await GroupSession.findById(id);
  if (!session) {
    throw new HttpError(404, 'SESSION_NOT_FOUND', 'Group session not found');
  }

  const participantIndex = session.participants.findIndex(
    (p) => String(p) === userId
  );
  if (participantIndex < 0) {
    throw new HttpError(403, 'NOT_PARTICIPANT', 'You are not a participant in this session');
  }

  session.participants.splice(participantIndex, 1);
  if (session.status === 'full') {
    session.status = 'open';
  }
  await session.save();

  return { success: true };
}

export async function completeSession(sessionId: string, userId: string) {
  const id = toObjectId(sessionId);
  const session = await GroupSession.findById(id);
  if (!session) {
    throw new HttpError(404, 'SESSION_NOT_FOUND', 'Group session not found');
  }
  if (String(session.teacherId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'Only the teacher can complete a group session');
  }

  const allowed = VALID_TRANSITIONS[session.status];
  if (!allowed.includes('completed')) {
    throw new HttpError(400, 'INVALID_STATE', `Cannot complete a session in "${session.status}" state`);
  }

  session.status = 'completed';
  await session.save();

  const allParticipants = [String(session.teacherId), ...session.participants.map(String)];
  for (const uid of allParticipants) {
    await Notification.create({
      userId: new Types.ObjectId(uid),
      type: 'system_warning',
      referenceId: session._id,
      referenceModel: 'GroupSession',
      message: `Group session "${session.title}" has been completed!`,
    });
  }

  return session.toJSON();
}

export async function cancelSession(sessionId: string, userId: string, reason?: string) {
  const id = toObjectId(sessionId);
  const session = await GroupSession.findById(id);
  if (!session) {
    throw new HttpError(404, 'SESSION_NOT_FOUND', 'Group session not found');
  }
  if (String(session.teacherId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'Only the teacher can cancel a group session');
  }

  const allowed = VALID_TRANSITIONS[session.status];
  if (!allowed.includes('cancelled')) {
    throw new HttpError(400, 'INVALID_STATE', `Cannot cancel a session in "${session.status}" state`);
  }

  session.status = 'cancelled';
  if (reason) session.cancelledReason = reason.slice(0, 300);
  await session.save();

  const allParticipants = session.participants.map(String);
  for (const uid of allParticipants) {
    await Notification.create({
      userId: new Types.ObjectId(uid),
      type: 'system_warning',
      referenceId: session._id,
      referenceModel: 'GroupSession',
      message: `Group session "${session.title}" has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
    });
  }

  return session.toJSON();
}

export async function updateSession(
  sessionId: string,
  userId: string,
  input: { title?: string; description?: string; scheduledAt?: string; location?: string }
) {
  const id = toObjectId(sessionId);
  const session = await GroupSession.findById(id);
  if (!session) {
    throw new HttpError(404, 'SESSION_NOT_FOUND', 'Group session not found');
  }
  if (String(session.teacherId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'Only the teacher can update a group session');
  }
  if (session.status === 'completed' || session.status === 'cancelled') {
    throw new HttpError(400, 'SESSION_CLOSED', 'Cannot update a completed or cancelled session');
  }

  if (input.title !== undefined) session.title = input.title.trim();
  if (input.description !== undefined) session.description = input.description.trim().slice(0, 500);
  if (input.scheduledAt !== undefined) session.scheduledAt = new Date(input.scheduledAt);
  if (input.location !== undefined) session.location = input.location.trim().slice(0, 200);

  await session.save();
  return session.toJSON();
}
