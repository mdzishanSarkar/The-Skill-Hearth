import { Types } from 'mongoose';
import { SkillJournal, Connection } from '../models';
import { HttpError } from '../utils/errors';
import { recordStreakActivity } from './streak';
import { awardXP } from './gamification';

function toObjectId(value: string | Types.ObjectId): Types.ObjectId {
  return typeof value === 'string' ? new Types.ObjectId(value) : value;
}

const TEACHER_PROMPT = 'What went well today? What would you do differently next time?';
const LEARNER_PROMPT = 'What did you learn today? What will you try on your own next?';

export type JournalMood = 1 | 2 | 3 | 4 | 5;

async function resolveRole(
  userId: Types.ObjectId,
  connectionId: Types.ObjectId
): Promise<{ role: 'teacher' | 'learner'; prompt: string }> {
  const connection = await Connection.findOne({
    _id: connectionId,
    status: { $in: ['completed', 'accepted'] },
  })
    .select('requesterId teacherId')
    .lean();

  if (!connection) {
    throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found or not active.');
  }

  const teacherId = toObjectId(connection.teacherId);
  const requesterId = toObjectId(connection.requesterId);

  if (userId.equals(teacherId)) {
    return { role: 'teacher', prompt: TEACHER_PROMPT };
  }
  if (userId.equals(requesterId)) {
    return { role: 'learner', prompt: LEARNER_PROMPT };
  }
  throw new HttpError(403, 'NOT_A_PARTICIPANT', 'You are not part of this connection.');
}

function pickPrompt(explicit: string | undefined, defaultPrompt: string): string {
  return explicit && explicit.trim() ? explicit.trim().slice(0, 300) : defaultPrompt;
}

export async function listEntries(
  userId: string | Types.ObjectId,
  page = 1,
  limit = 20
): Promise<{ entries: unknown[]; total: number; page: number; pages: number }> {
  const id = toObjectId(userId);
  const skip = (page - 1) * limit;

  const total = await SkillJournal.countDocuments({ userId: id });
  const entries = await SkillJournal.find({ userId: id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'connectionId',
      populate: { path: 'skillId', select: 'name emoji category' },
    })
    .lean();

  return {
    entries: entries.map(serialize),
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

export async function listConnectionEntries(userId: string | Types.ObjectId, connectionId: string) {
  const id = toObjectId(userId);
  const connection = await Connection.findOne({ _id: connectionId }).select('requesterId teacherId').lean();
  if (!connection) {
    throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found.');
  }
  const cid = toObjectId(connectionId);
  const teacherId = toObjectId(connection.teacherId);
  const requesterId = toObjectId(connection.requesterId);
  if (!id.equals(teacherId) && !id.equals(requesterId)) {
    throw new HttpError(403, 'NOT_A_PARTICIPANT', 'You are not part of this connection.');
  }

  const entries = await SkillJournal.find({ userId: id, connectionId: cid })
    .sort({ createdAt: -1 })
    .populate({ path: 'connectionId', populate: { path: 'skillId', select: 'name emoji category' } })
    .lean();
  return entries.map(serialize);
}

export async function getEntry(userId: string | Types.ObjectId, entryId: string) {
  const id = toObjectId(userId);
  const entry = await SkillJournal.findById(entryId)
    .populate({ path: 'connectionId', populate: { path: 'skillId', select: 'name emoji category' } })
    .lean();
  if (!entry) {
    throw new HttpError(404, 'ENTRY_NOT_FOUND', 'Journal entry not found.');
  }
  if (!id.equals(toObjectId(entry.userId))) {
    throw new HttpError(403, 'FORBIDDEN', 'You cannot view this journal entry.');
  }
  return serialize(entry);
}

export async function createEntry(
  userId: string | Types.ObjectId,
  connectionId: string,
  data: { prompt?: string; content: string; mood?: JournalMood; isHighlighted?: boolean }
) {
  const id = toObjectId(userId);
  const content = data.content?.trim();
  if (!content || content.length > 2000) {
    throw new HttpError(400, 'INVALID_CONTENT', 'Journal entry content is required (max 2000 characters).');
  }
  if (data.mood !== undefined && (data.mood < 1 || data.mood > 5)) {
    throw new HttpError(400, 'INVALID_MOOD', 'Mood must be between 1 and 5.');
  }

  const { prompt } = await resolveRole(id, toObjectId(connectionId));

  const entry = await SkillJournal.create({
    userId: id,
    connectionId: toObjectId(connectionId),
    prompt: pickPrompt(data.prompt, prompt),
    content,
    mood: data.mood,
    isHighlighted: data.isHighlighted ?? false,
  });

  await recordStreakActivity(id, 'logging');
  await awardXP(id, 'journal_entry', { sourceType: 'skill_journal', sourceId: entry._id });

  const full = await entry.populate({
    path: 'connectionId',
    populate: { path: 'skillId', select: 'name emoji category' },
  });
  return serialize(full.toObject());
}

export async function updateEntry(
  userId: string | Types.ObjectId,
  entryId: string,
  data: { content?: string; mood?: JournalMood; isHighlighted?: boolean; prompt?: string }
) {
  const id = toObjectId(userId);
  const entry = await SkillJournal.findById(entryId);
  if (!entry) {
    throw new HttpError(404, 'ENTRY_NOT_FOUND', 'Journal entry not found.');
  }
  if (!id.equals(entry.userId)) {
    throw new HttpError(403, 'FORBIDDEN', 'You can only edit your own journal entries.');
  }
  if (data.content !== undefined) {
    const content = data.content.trim();
    if (!content || content.length > 2000) {
      throw new HttpError(400, 'INVALID_CONTENT', 'Journal entry content is required (max 2000 characters).');
    }
    entry.content = content;
  }
  if (data.prompt !== undefined && data.prompt.trim()) {
    entry.prompt = data.prompt.trim().slice(0, 300);
  }
  if (data.mood !== undefined) {
    if (data.mood < 1 || data.mood > 5) {
      throw new HttpError(400, 'INVALID_MOOD', 'Mood must be between 1 and 5.');
    }
    entry.mood = data.mood;
  }
  if (data.isHighlighted !== undefined) {
    entry.isHighlighted = data.isHighlighted;
  }
  await entry.save();

  const full = await entry.populate({
    path: 'connectionId',
    populate: { path: 'skillId', select: 'name emoji category' },
  });
  return serialize(full.toObject());
}

export async function deleteEntry(userId: string | Types.ObjectId, entryId: string) {
  const id = toObjectId(userId);
  const entry = await SkillJournal.findById(entryId);
  if (!entry) {
    throw new HttpError(404, 'ENTRY_NOT_FOUND', 'Journal entry not found.');
  }
  if (!id.equals(entry.userId)) {
    throw new HttpError(403, 'FORBIDDEN', 'You can only delete your own journal entries.');
  }
  await entry.deleteOne();
}

function serialize(entry: Record<string, any>): Record<string, any> {
  const connection = entry.connectionId as Record<string, any> | null;
  const skill = connection?.skillId as Record<string, any> | null;
  return {
    id: entry._id,
    connectionId: entry.connectionId?._id ?? entry.connectionId,
    connectionStatus: connection?.status,
    skill: skill
      ? { id: skill._id, name: skill.name, emoji: skill.emoji, category: skill.category }
      : null,
    prompt: entry.prompt,
    content: entry.content,
    mood: entry.mood ?? null,
    isHighlighted: entry.isHighlighted,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}
