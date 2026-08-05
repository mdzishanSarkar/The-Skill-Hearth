import { Types } from 'mongoose';
import { Message, Connection, Notification } from '../models';
import { HttpError } from '../utils/errors';

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

export async function sendMessage(connectionId: string, senderId: string, content: string) {
  const connId = toObjectId(connectionId);
  const senderObjectId = toObjectId(senderId);

  const connection = await Connection.findById(connId);
  if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found');

  const isParticipant =
    String(connection.requesterId) === senderId || String(connection.teacherId) === senderId;
  if (!isParticipant) {
    throw new HttpError(403, 'FORBIDDEN', 'Not a participant of this connection');
  }
  if (connection.status !== 'accepted') {
    throw new HttpError(400, 'CHAT_LOCKED', 'Chat is only available after the request is accepted');
  }

  const trimmed = content.trim().slice(0, 1000);
  if (!trimmed) throw new HttpError(400, 'VALIDATION_ERROR', 'Message content cannot be empty');

  const message = await Message.create({
    connectionId: connId,
    senderId: senderObjectId,
    content: trimmed,
    type: 'text',
  });

  const otherUserId =
    String(connection.requesterId) === senderId
      ? String(connection.teacherId)
      : String(connection.requesterId);

  await Notification.create({
    userId: new Types.ObjectId(otherUserId),
    type: 'new_message',
    referenceId: message._id,
    referenceModel: 'Message',
    message: 'You have a new message',
  });

  return message.toJSON();
}

export async function getMessages(connectionId: string, userId: string, page = 1, limit = 50) {
  const connId = toObjectId(connectionId);
  const userObjectId = toObjectId(userId);

  const connection = await Connection.findById(connId);
  if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found');

  const isParticipant =
    String(connection.requesterId) === userId || String(connection.teacherId) === userId;
  if (!isParticipant) {
    throw new HttpError(403, 'FORBIDDEN', 'Not a participant of this connection');
  }

  const skip = (Math.max(1, page) - 1) * limit;
  const filter = { connectionId: connId, isDeleted: false };

  const [messages, total] = await Promise.all([
    Message.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'displayName avatar')
      .lean(),
    Message.countDocuments(filter),
  ]);

  return {
    messages: messages.reverse(),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function markAsRead(connectionId: string, userId: string) {
  const connId = toObjectId(connectionId);

  const connection = await Connection.findById(connId);
  if (!connection) throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found');

  const isParticipant =
    String(connection.requesterId) === userId || String(connection.teacherId) === userId;
  if (!isParticipant) {
    throw new HttpError(403, 'FORBIDDEN', 'Not a participant of this connection');
  }

  await Message.updateMany(
    {
      connectionId: connId,
      senderId: { $ne: new Types.ObjectId(userId) },
      readAt: null,
    },
    { $set: { readAt: new Date() } },
  );

  return { success: true };
}

export async function markAsDelivered(messageId: string) {
  const id = toObjectId(messageId);
  await Message.updateOne(
    { _id: id, deliveredAt: null },
    { $set: { deliveredAt: new Date() } },
  );
  return { success: true };
}

export async function getUnreadCount(userId: string) {
  const userObjectId = new Types.ObjectId(userId);

  const connections = await Connection.find({
    status: 'accepted',
    $or: [{ requesterId: userObjectId }, { teacherId: userObjectId }],
  }).select('_id');

  const connectionIds = connections.map((c) => c._id);

  const count = await Message.countDocuments({
    connectionId: { $in: connectionIds },
    senderId: { $ne: userObjectId },
    readAt: null,
    isDeleted: false,
  });

  return count;
}
