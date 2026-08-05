import { Types } from 'mongoose';
import { Message, Connection } from '../models';
import { HttpError } from '../utils/errors';

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

export async function sendImageMessage(
  connectionId: string,
  senderId: string,
  imageUrl: string,
  imagePublicId: string,
  caption?: string,
) {
  const connId = toObjectId(connectionId);
  const senderObjectId = toObjectId(senderId);

  const connection = await Connection.findById(connId);
  if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found');

  const isParticipant =
    String(connection.requesterId) === senderId || String(connection.teacherId) === senderId;
  if (!isParticipant) throw new HttpError(403, 'FORBIDDEN', 'Not a participant');
  if (connection.status !== 'accepted') {
    throw new HttpError(400, 'CHAT_LOCKED', 'Chat is only available after the request is accepted');
  }

  const message = await Message.create({
    connectionId: connId,
    senderId: senderObjectId,
    content: caption?.trim().slice(0, 500) || '',
    type: 'image',
    imageUrl,
    imagePublicId,
  });

  return message.toJSON();
}

export async function sendSystemMessage(
  connectionId: string,
  content: string,
) {
  const connId = toObjectId(connectionId);

  const message = await Message.create({
    connectionId: connId,
    senderId: new Types.ObjectId(),
    content,
    type: 'system',
  });

  return message.toJSON();
}

export async function addReaction(messageId: string, userId: string, emoji: string) {
  const id = toObjectId(messageId);
  const VALID_EMOJIS = ['👍', '❤️', '😄', '🙏'];
  if (!VALID_EMOJIS.includes(emoji)) {
    throw new HttpError(400, 'INVALID_EMOJI', 'Invalid emoji. Allowed: 👍 ❤️ 😄 🙏');
  }

  const message = await Message.findById(id);
  if (!message) throw new HttpError(404, 'NOT_FOUND', 'Message not found');

  const existingIndex = message.reactions.findIndex(
    (r) => String(r.userId) === userId && r.emoji === emoji,
  );

  if (existingIndex >= 0) {
    message.reactions.splice(existingIndex, 1);
  } else {
    message.reactions.push({ userId: new Types.ObjectId(userId), emoji, createdAt: new Date() } as never);
  }

  await message.save();
  return message.toJSON();
}

export async function searchMessages(
  connectionId: string,
  userId: string,
  query: string,
  page = 1,
  limit = 20,
) {
  const connId = toObjectId(connectionId);

  const connection = await Connection.findById(connId);
  if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found');

  const isParticipant =
    String(connection.requesterId) === userId || String(connection.teacherId) === userId;
  if (!isParticipant) throw new HttpError(403, 'FORBIDDEN', 'Not a participant');

  const trimmed = query.trim();
  if (!trimmed) throw new HttpError(400, 'VALIDATION_ERROR', 'Search query is required');

  const skip = (Math.max(1, page) - 1) * Math.min(50, Math.max(1, limit));

  const filter = {
    connectionId: connId,
    isDeleted: false,
    type: 'text' as const,
    content: { $regex: trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
  };

  const [messages, total] = await Promise.all([
    Message.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'displayName avatar')
      .lean(),
    Message.countDocuments(filter),
  ]);

  return { messages, total, page, totalPages: Math.ceil(total / limit) };
}
