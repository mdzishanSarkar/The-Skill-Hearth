import mongoose, { Types } from 'mongoose';
import { Message, Connection, UserInboxPreference, Conversation } from '../models';
import { HttpError } from '../utils/errors';
import { sanitizeText } from '../utils/sanitize';
import { INBOX_ERRORS } from '../constants/errors';
import { queueMessageNotification } from './inbox-notification.service';

const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥'] as const;

function assertValidObjectId(value: unknown, label = 'id') {
  if (!value || !mongoose.Types.ObjectId.isValid(String(value))) {
    throw new HttpError(400, 'INVALID_ID', `${label} is not a valid MongoDB ObjectId`);
  }
  return new mongoose.Types.ObjectId(String(value));
}

function normalizeContent(value: string) {
  const clean = sanitizeText(value ?? '');
  if (clean.length > 1000) {
    throw new HttpError(INBOX_ERRORS.CONTENT_TOO_LONG.status, INBOX_ERRORS.CONTENT_TOO_LONG.code, INBOX_ERRORS.CONTENT_TOO_LONG.message);
  }
  return clean;
}

export async function sendMessage(params: { senderId: string; connectionId: string; content: string; type?: 'text' | 'image' | 'system' }) {
  const connectionObjectId = assertValidObjectId(params.connectionId, 'connectionId');
  const senderObjectId = assertValidObjectId(params.senderId, 'senderId');

  const connection = await Connection.findById(connectionObjectId).lean();
  if (!connection) {
    throw new HttpError(INBOX_ERRORS.CONNECTION_NOT_FOUND.status, INBOX_ERRORS.CONNECTION_NOT_FOUND.code, INBOX_ERRORS.CONNECTION_NOT_FOUND.message);
  }

  if (connection.status !== 'accepted') {
    throw new HttpError(INBOX_ERRORS.CONNECTION_NOT_ACCEPTED.status, INBOX_ERRORS.CONNECTION_NOT_ACCEPTED.code, INBOX_ERRORS.CONNECTION_NOT_ACCEPTED.message);
  }

  const isParticipant = String(connection.requesterId) === String(senderObjectId) || String(connection.teacherId) === String(senderObjectId);
  if (!isParticipant) {
    throw new HttpError(INBOX_ERRORS.NOT_PARTICIPANT.status, INBOX_ERRORS.NOT_PARTICIPANT.code, INBOX_ERRORS.NOT_PARTICIPANT.message);
  }

  const content = normalizeContent(params.content);
  if (!content) {
    throw new HttpError(400, 'EMPTY_MESSAGE', 'Message content cannot be empty');
  }

  const message = await Message.create({
    connectionId: connectionObjectId,
    senderId: senderObjectId,
    content,
    type: params.type || 'text',
  });

  await Connection.findByIdAndUpdate(connectionObjectId, { updatedAt: new Date() });

  const recipientId = String(connection.requesterId) === String(senderObjectId) ? connection.teacherId : connection.requesterId;
  const recipientString = String(recipientId);
  if (recipientString) {
    await queueMessageNotification({
      recipientId: recipientString,
      senderId: String(senderObjectId),
      connectionId: String(connectionObjectId),
      messagePreview: content.slice(0, 80),
    });
  }

  return message.toJSON();
}

export async function getHistory(params: { connectionId: string; requestingUserId: string; limit?: number; before?: string }) {
  const connectionObjectId = assertValidObjectId(params.connectionId, 'connectionId');
  const requestingUserIdObject = assertValidObjectId(params.requestingUserId, 'requestingUserId');

  const connection = await Connection.findById(connectionObjectId).lean();
  if (!connection) {
    throw new HttpError(INBOX_ERRORS.CONNECTION_NOT_FOUND.status, INBOX_ERRORS.CONNECTION_NOT_FOUND.code, INBOX_ERRORS.CONNECTION_NOT_FOUND.message);
  }

  const isParticipant = String(connection.requesterId) === String(requestingUserIdObject) || String(connection.teacherId) === String(requestingUserIdObject);
  if (!isParticipant) {
    throw new HttpError(INBOX_ERRORS.NOT_PARTICIPANT.status, INBOX_ERRORS.NOT_PARTICIPANT.code, INBOX_ERRORS.NOT_PARTICIPANT.message);
  }

  const limit = Math.min(Math.max(Number(params.limit) || 50, 1), 200);
  let query: Record<string, unknown> = { connectionId: connectionObjectId };

  if (params.before) {
    try {
      const decoded = Buffer.from(params.before, 'base64').toString('utf8');
      const [messageId, isoDate] = decoded.split('|');
      if (!messageId || !isoDate) throw new Error('bad cursor');
      query = {
        ...query,
        createdAt: { $lt: new Date(isoDate) },
        _id: { $lt: new mongoose.Types.ObjectId(messageId) },
      };
    } catch {
      throw new HttpError(INBOX_ERRORS.INVALID_CURSOR.status, INBOX_ERRORS.INVALID_CURSOR.code, INBOX_ERRORS.INVALID_CURSOR.message);
    }
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .populate('senderId', 'displayName avatar')
    .lean();

  const hasMore = messages.length > limit;
  const sliced = messages.slice(0, limit);
  const nextCursor = hasMore && sliced.length > 0
    ? Buffer.from(`${sliced[sliced.length - 1]._id}|${sliced[sliced.length - 1].createdAt.toISOString()}`).toString('base64')
    : undefined;

  const normalized = sliced.map((message: any) => {
    if (message.deletedAt) {
      return { ...message, content: null, isDeleted: true };
    }
    return { ...message, isDeleted: false };
  });

  return { messages: normalized.reverse(), nextCursor, hasMore };
}

export async function deleteMessage(params: { messageId: string; requestingUserId: string }) {
  const messageId = assertValidObjectId(params.messageId, 'messageId');
  const userId = assertValidObjectId(params.requestingUserId, 'requestingUserId');

  const message = await Message.findById(messageId).lean();
  if (!message) {
    throw new HttpError(INBOX_ERRORS.MESSAGE_NOT_FOUND.status, INBOX_ERRORS.MESSAGE_NOT_FOUND.code, INBOX_ERRORS.MESSAGE_NOT_FOUND.message);
  }

  if (String(message.senderId) !== String(userId)) {
    throw new HttpError(INBOX_ERRORS.NOT_SENDER.status, INBOX_ERRORS.NOT_SENDER.code, INBOX_ERRORS.NOT_SENDER.message);
  }

  const ageMinutes = (Date.now() - new Date(message.createdAt).getTime()) / 60000;
  if (ageMinutes > 5) {
    throw new HttpError(INBOX_ERRORS.DELETE_WINDOW_EXPIRED.status, INBOX_ERRORS.DELETE_WINDOW_EXPIRED.code, INBOX_ERRORS.DELETE_WINDOW_EXPIRED.message);
  }

  const updated = await Message.findByIdAndUpdate(
    messageId,
    {
      deletedAt: new Date(),
      deletedBy: userId,
      content: '',
    },
    { new: true }
  );

  return { message: 'Message deleted', result: updated };
}

export async function markAsRead(params: { connectionId: string; userId: string; lastReadMessageId?: string }) {
  const connectionIdObject = assertValidObjectId(params.connectionId, 'connectionId');
  const userObjectId = assertValidObjectId(params.userId, 'userId');

  const connection = await Connection.findById(connectionIdObject).lean();
  if (!connection) {
    throw new HttpError(INBOX_ERRORS.CONNECTION_NOT_FOUND.status, INBOX_ERRORS.CONNECTION_NOT_FOUND.code, INBOX_ERRORS.CONNECTION_NOT_FOUND.message);
  }

  const isParticipant = String(connection.requesterId) === String(userObjectId) || String(connection.teacherId) === String(userObjectId);
  if (!isParticipant) {
    throw new HttpError(INBOX_ERRORS.NOT_PARTICIPANT.status, INBOX_ERRORS.NOT_PARTICIPANT.code, INBOX_ERRORS.NOT_PARTICIPANT.message);
  }

  const filter: Record<string, unknown> = {
    connectionId: connectionIdObject,
    senderId: { $ne: userObjectId },
    readAt: null,
  };

  if (params.lastReadMessageId) {
    filter._id = { $lte: assertValidObjectId(params.lastReadMessageId, 'lastReadMessageId') };
  }

  const result = await Message.updateMany(filter, { $set: { readAt: new Date() } });
  await UserInboxPreference.findOneAndUpdate(
    { userId: userObjectId, connectionId: connectionIdObject },
    { $set: { lastReadAt: new Date() } },
    { upsert: true, new: true }
  );

  return { updatedCount: result.modifiedCount ?? 0 };
}

export async function addReaction(params: { messageId: string; userId: string; emoji: string }) {
  const messageId = assertValidObjectId(params.messageId, 'messageId');
  const userId = assertValidObjectId(params.userId, 'userId');

  const emoji = params.emoji as typeof ALLOWED_EMOJIS[number];
  if (!ALLOWED_EMOJIS.includes(emoji)) {
    throw new HttpError(INBOX_ERRORS.INVALID_EMOJI.status, INBOX_ERRORS.INVALID_EMOJI.code, INBOX_ERRORS.INVALID_EMOJI.message);
  }

  const message = await Message.findById(messageId).lean();
  if (!message) {
    throw new HttpError(INBOX_ERRORS.MESSAGE_NOT_FOUND.status, INBOX_ERRORS.MESSAGE_NOT_FOUND.code, INBOX_ERRORS.MESSAGE_NOT_FOUND.message);
  }

  const connection = await Connection.findById(message.connectionId).lean();
  const isParticipant = connection && (String(connection.requesterId) === String(userId) || String(connection.teacherId) === String(userId));
  if (!isParticipant) {
    throw new HttpError(INBOX_ERRORS.NOT_PARTICIPANT.status, INBOX_ERRORS.NOT_PARTICIPANT.code, INBOX_ERRORS.NOT_PARTICIPANT.message);
  }

  const existing = message.reactions ?? [];
  const existingIndex = existing.findIndex((reaction: any) => String(reaction.userId) === String(userId) && reaction.emoji === emoji);
  const otherIndex = existing.findIndex((reaction: any) => String(reaction.userId) === String(userId));

  let reactions: any[] = [...existing];
  if (existingIndex >= 0) {
    reactions = reactions.filter((reaction: any) => !(String(reaction.userId) === String(userId) && reaction.emoji === emoji));
  } else if (otherIndex >= 0) {
    reactions = reactions.filter((reaction: any) => String(reaction.userId) !== String(userId));
    reactions.push({ userId, emoji });
  } else {
    reactions.push({ userId, emoji });
  }

  const updated = await Message.findByIdAndUpdate(messageId, { reactions }, { new: true });
  return { reactions: updated?.reactions ?? reactions };
}

export async function getConversations(params: { userId: string; page?: number; limit?: number; filter?: 'all' | 'unread' | 'archived' | 'pinned' }) {
  const userIdObject = assertValidObjectId(params.userId, 'userId');
  const finalResult = await Conversation.getForUser(String(userIdObject), {
    page: params.page,
    limit: params.limit,
    filter: params.filter,
  });
  return finalResult;
}

export async function setPreference(params: { userId: string; connectionId: string; action: 'pin' | 'unpin' | 'mute' | 'unmute' | 'archive' | 'unarchive'; muteDuration?: number }) {
  const userIdObject = assertValidObjectId(params.userId, 'userId');
  const connectionIdObject = assertValidObjectId(params.connectionId, 'connectionId');

  const connection = await Connection.findById(connectionIdObject).lean();
  if (!connection) {
    throw new HttpError(INBOX_ERRORS.CONNECTION_NOT_FOUND.status, INBOX_ERRORS.CONNECTION_NOT_FOUND.code, INBOX_ERRORS.CONNECTION_NOT_FOUND.message);
  }

  const isParticipant = String(connection.requesterId) === String(userIdObject) || String(connection.teacherId) === String(userIdObject);
  if (!isParticipant) {
    throw new HttpError(INBOX_ERRORS.NOT_PARTICIPANT.status, INBOX_ERRORS.NOT_PARTICIPANT.code, INBOX_ERRORS.NOT_PARTICIPANT.message);
  }

  const current = await UserInboxPreference.findOne({ userId: userIdObject, connectionId: connectionIdObject }).lean();
  const patch: Record<string, any> = {};

  if (params.action === 'pin') patch.isPinned = true;
  if (params.action === 'unpin') patch.isPinned = false;
  if (params.action === 'mute') {
    patch.isMuted = true;
    if (params.muteDuration) {
      patch.mutedUntil = new Date(Date.now() + params.muteDuration * 1000);
    }
  }
  if (params.action === 'unmute') {
    patch.isMuted = false;
    patch.mutedUntil = undefined;
  }
  if (params.action === 'archive') {
    patch.isArchived = true;
    patch.archivedAt = new Date();
  }
  if (params.action === 'unarchive') {
    patch.isArchived = false;
    patch.archivedAt = undefined;
  }

  const updated = await UserInboxPreference.findOneAndUpdate(
    { userId: userIdObject, connectionId: connectionIdObject },
    { $set: { ...patch } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return updated || current;
}

export async function getTotalUnread(userId: string) {
  return Conversation.getTotalUnread(userId);
}
