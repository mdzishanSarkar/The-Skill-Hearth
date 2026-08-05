import { Types } from 'mongoose';
import { Connection, SessionNote, Notification, Message } from '../models';
import { HttpError } from '../utils/errors';

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

export interface ScheduleProposal {
  proposedBy: string;
  proposedAt: Date;
  status: 'pending' | 'confirmed' | 'declined';
}

export interface SessionSchedule {
  connectionId: Types.ObjectId;
  proposals: ScheduleProposal[];
  confirmedTime?: Date;
  duration?: number;
  format?: string;
}

// Extend Connection with schedule fields (stored in the connection document)
export async function proposeSchedule(
  connectionId: string,
  userId: string,
  proposedAt: Date,
) {
  const id = toObjectId(connectionId);
  const connection = await Connection.findById(id);
  if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found');

  const isParticipant =
    String(connection.requesterId) === userId || String(connection.teacherId) === userId;
  if (!isParticipant) throw new HttpError(403, 'FORBIDDEN', 'Not a participant');
  if (connection.status !== 'accepted') {
    throw new HttpError(400, 'INVALID_STATE', 'Can only schedule accepted connections');
  }

  await Message.create({
    connectionId: id,
    senderId: new Types.ObjectId(userId),
    content: `Proposed session time: ${proposedAt.toLocaleString()}`,
    type: 'system',
  });

  const otherUserId =
    String(connection.requesterId) === userId
      ? String(connection.teacherId)
      : String(connection.requesterId);

  await Notification.create({
    userId: new Types.ObjectId(otherUserId),
    type: 'request_received',
    referenceId: connection._id,
    referenceModel: 'Connection',
    message: `A session time has been proposed: ${proposedAt.toLocaleString()}`,
  });

  return { proposed: true, proposedAt };
}

export async function confirmSchedule(connectionId: string, userId: string) {
  const id = toObjectId(connectionId);
  const connection = await Connection.findById(id);
  if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found');

  const isParticipant =
    String(connection.requesterId) === userId || String(connection.teacherId) === userId;
  if (!isParticipant) throw new HttpError(403, 'FORBIDDEN', 'Not a participant');

  await Message.create({
    connectionId: id,
    senderId: new Types.ObjectId(userId),
    content: 'Session time confirmed!',
    type: 'system',
  });

  return { confirmed: true };
}

export async function generateICS(connectionId: string, userId: string) {
  const id = toObjectId(connectionId);
  const connection = await Connection.findById(id)
    .populate('skillId', 'skillName')
    .lean();
  if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found');

  const isParticipant =
    String(connection.requesterId) === userId || String(connection.teacherId) === userId;
  if (!isParticipant) throw new HttpError(403, 'FORBIDDEN', 'Not a participant');

  const skill = connection.skillId as unknown as { skillName: string } | null;
  const skillName = skill?.skillName || 'Skill Session';
  const now = new Date();
  const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SkillHearth//Session//EN',
    'BEGIN:VEVENT',
    `DTSTART:${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTEND:${end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `SUMMARY:${skillName} Session`,
    `DESCRIPTION:SkillHearth skill session for ${skillName}`,
    `UID:${connectionId}@skillhearth`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return ics;
}

export async function getSessionNote(connectionId: string, userId: string) {
  const id = toObjectId(connectionId);
  const note = await SessionNote.findOne({ connectionId: id, userId: new Types.ObjectId(userId) }).lean();
  return note || { content: '' };
}

export async function updateSessionNote(connectionId: string, userId: string, content: string) {
  const id = toObjectId(connectionId);
  const trimmed = content.trim().slice(0, 2000);

  const note = await SessionNote.findOneAndUpdate(
    { connectionId: id, userId: new Types.ObjectId(userId) },
    { content: trimmed },
    { upsert: true, new: true },
  ).lean();

  return note;
}

export async function reportNoShow(connectionId: string, userId: string, reason?: string) {
  const id = toObjectId(connectionId);
  const connection = await Connection.findById(id);
  if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found');

  const isParticipant =
    String(connection.requesterId) === userId || String(connection.teacherId) === userId;
  if (!isParticipant) throw new HttpError(403, 'FORBIDDEN', 'Not a participant');
  if (connection.status !== 'accepted') {
    throw new HttpError(400, 'INVALID_STATE', 'Can only report no-show for accepted connections');
  }

  await Message.create({
    connectionId: id,
    senderId: new Types.ObjectId(userId),
    content: `Session marked as no-show.${reason ? ` Reason: ${reason}` : ''}`,
    type: 'system',
  });

  const otherUserId =
    String(connection.requesterId) === userId
      ? String(connection.teacherId)
      : String(connection.requesterId);

  await Notification.create({
    userId: new Types.ObjectId(otherUserId),
    type: 'system_warning',
    referenceId: connection._id,
    referenceModel: 'Connection',
    message: 'A session was reported as a no-show.',
  });

  return { reported: true };
}
