import { Types } from 'mongoose';
import { Connection, Skill, User } from '../models';
import type { ConnectionStatus } from '../models';
import { HttpError } from '../utils/errors';
import { createNotification } from './notification';

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

const VALID_TRANSITIONS: Record<ConnectionStatus, ConnectionStatus[]> = {
  pending: ['accepted', 'rejected', 'withdrawn'],
  accepted: ['completed', 'cancelled'],
  rejected: [],
  completed: [],
  withdrawn: [],
  cancelled: [],
};

export interface SendRequestInput {
  requesterId: string;
  teacherId: string;
  skillId: string;
  message: string;
  proposedFormat: 'in-person' | 'online' | 'either';
}

export async function sendRequest(input: SendRequestInput) {
  const requesterObjectId = toObjectId(input.requesterId);
  const teacherObjectId = toObjectId(input.teacherId);
  const skillObjectId = toObjectId(input.skillId);

  if (input.requesterId === input.teacherId) {
    throw new HttpError(400, 'SELF_REQUEST', 'Cannot send a request to yourself');
  }

  const skill = await Skill.findOne({ _id: skillObjectId, isDeleted: false, isActive: true });
  if (!skill) throw new HttpError(404, 'SKILL_NOT_FOUND', 'Skill not found');
  if (String(skill.userId) !== input.teacherId) {
    throw new HttpError(400, 'SKILL_MISMATCH', 'This skill does not belong to the specified teacher');
  }

  const teacher = await User.findById(teacherObjectId).select('status displayName');
  if (!teacher || teacher.status !== 'active') {
    throw new HttpError(404, 'TEACHER_NOT_FOUND', 'Teacher not found or inactive');
  }

  const existingPending = await Connection.findOne({
    requesterId: requesterObjectId,
    teacherId: teacherObjectId,
    skillId: skillObjectId,
    status: 'pending',
  });
  if (existingPending) {
    throw new HttpError(409, 'DUPLICATE_REQUEST', 'You already have a pending request for this skill');
  }

  const connection = await Connection.create({
    requesterId: requesterObjectId,
    teacherId: teacherObjectId,
    skillId: skillObjectId,
    message: input.message.slice(0, 500),
    proposedFormat: input.proposedFormat,
    status: 'pending',
  });

  await createNotification({
    userId: teacherObjectId,
    type: 'request_received',
    referenceId: connection._id,
    referenceModel: 'Connection',
    message: `New skill request from ${input.requesterId}`,
  });

  return connection.toJSON();
}

export async function respondToRequest(
  connectionId: string,
  userId: string,
  action: 'accepted' | 'rejected',
  responseMessage?: string,
) {
  const id = toObjectId(connectionId);
  const connection = await Connection.findById(id);
  if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found');
  if (String(connection.teacherId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'Only the teacher can respond to this request');
  }
  if (connection.status !== 'pending') {
    throw new HttpError(400, 'INVALID_STATE', `Cannot respond to a request in "${connection.status}" state`);
  }

  const allowed = VALID_TRANSITIONS[connection.status];
  if (!allowed.includes(action)) {
    throw new HttpError(400, 'INVALID_TRANSITION', `Cannot transition from "${connection.status}" to "${action}"`);
  }

  connection.status = action;
  if (responseMessage) connection.responseMessage = responseMessage.slice(0, 500);
  await connection.save();

  await createNotification({
    userId: connection.requesterId,
    type: action === 'accepted' ? 'request_accepted' : 'request_rejected',
    referenceId: connection._id,
    referenceModel: 'Connection',
    message:
      action === 'accepted'
        ? 'Your skill request was accepted!'
        : 'Your skill request was declined.',
  });

  return connection.toJSON();
}

export async function withdrawRequest(connectionId: string, userId: string) {
  const id = toObjectId(connectionId);
  const connection = await Connection.findById(id);
  if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found');
  if (String(connection.requesterId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'Only the requester can withdraw this request');
  }
  if (connection.status !== 'pending') {
    throw new HttpError(400, 'INVALID_STATE', `Cannot withdraw a request in "${connection.status}" state`);
  }

  connection.status = 'withdrawn';
  await connection.save();
  return connection.toJSON();
}

export async function cancelConnection(connectionId: string, userId: string, reason?: string) {
  const id = toObjectId(connectionId);
  const connection = await Connection.findById(id);
  if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found');

  const isParticipant =
    String(connection.requesterId) === userId || String(connection.teacherId) === userId;
  if (!isParticipant) {
    throw new HttpError(403, 'FORBIDDEN', 'Only participants can cancel this connection');
  }
  if (connection.status !== 'accepted') {
    throw new HttpError(400, 'INVALID_STATE', 'Can only cancel an accepted connection');
  }

  connection.status = 'cancelled';
  connection.cancelledBy = new Types.ObjectId(userId);
  if (reason) connection.cancellationReason = reason.slice(0, 300);
  await connection.save();

  const otherUserId =
    String(connection.requesterId) === userId
      ? String(connection.teacherId)
      : String(connection.requesterId);

  await createNotification({
    userId: new Types.ObjectId(otherUserId),
    type: 'system_warning',
    referenceId: connection._id,
    referenceModel: 'Connection',
    message: 'The connection has been cancelled.',
  });

  return connection.toJSON();
}

export async function markCompleted(connectionId: string, userId: string) {
  const id = toObjectId(connectionId);
  const connection = await Connection.findById(id);
  if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found');

  const isParticipant =
    String(connection.requesterId) === userId || String(connection.teacherId) === userId;
  if (!isParticipant) {
    throw new HttpError(403, 'FORBIDDEN', 'Only participants can mark this connection as completed');
  }
  if (connection.status !== 'accepted') {
    throw new HttpError(400, 'INVALID_STATE', 'Can only complete an accepted connection');
  }

  connection.status = 'completed';
  connection.completedAt = new Date();
  await connection.save();

  const participants = [String(connection.requesterId), String(connection.teacherId)];
  for (const uid of participants) {
    await createNotification({
      userId: new Types.ObjectId(uid),
      type: 'review_prompt',
      referenceId: connection._id,
      referenceModel: 'Connection',
      message: 'How was your session? Leave a review!',
    });
  }

  return connection.toJSON();
}

export async function getConnection(connectionId: string, userId: string) {
  const id = toObjectId(connectionId);
  const connection = await Connection.findById(id)
    .populate('requesterId', 'displayName avatar')
    .populate('teacherId', 'displayName avatar')
    .populate('skillId', 'skillName categoryName type');
  if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found');

  const isParticipant =
    String(connection.requesterId) === userId || String(connection.teacherId) === userId;
  if (!isParticipant) {
    throw new HttpError(403, 'FORBIDDEN', 'Not a participant of this connection');
  }

  return connection.toJSON();
}

export async function getInbox(teacherId: string, page = 1, limit = 20) {
  const skip = (Math.max(1, page) - 1) * limit;
  const filter = { teacherId: new Types.ObjectId(teacherId), status: { $ne: 'withdrawn' as const } };

  const [connections, total] = await Promise.all([
    Connection.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('requesterId', 'displayName avatar')
      .populate('skillId', 'skillName categoryName type')
      .lean(),
    Connection.countDocuments(filter),
  ]);

  return {
    connections,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOutbox(requesterId: string, page = 1, limit = 20) {
  const skip = (Math.max(1, page) - 1) * limit;
  const filter = { requesterId: new Types.ObjectId(requesterId), status: { $ne: 'withdrawn' as const } };

  const [connections, total] = await Promise.all([
    Connection.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('teacherId', 'displayName avatar')
      .populate('skillId', 'skillName categoryName type')
      .lean(),
    Connection.countDocuments(filter),
  ]);

  return {
    connections,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getActiveChats(userId: string) {
  const userObjectId = new Types.ObjectId(userId);
  const connections = await Connection.find({
    status: { $in: ['accepted', 'completed'] },
    $or: [{ requesterId: userObjectId }, { teacherId: userObjectId }],
  })
    .sort({ updatedAt: -1 })
    .populate('requesterId', 'displayName avatar')
    .populate('teacherId', 'displayName avatar')
    .populate('skillId', 'skillName categoryName')
    .lean();

  return connections;
}
