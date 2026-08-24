import { Types } from 'mongoose';
import { DirectMessage, Friendship, User } from '../models';
import { HttpError } from '../utils/errors';
import { getIO } from '../config/socket';
import { getDirectMessageRoomId } from './friendship';

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

async function areFriends(userAId: string, userBId: string): Promise<boolean> {
  const friendship = await Friendship.findOne({
    status: 'accepted',
    $or: [
      { requesterId: userAId, addresseeId: userBId },
      { requesterId: userBId, addresseeId: userAId },
    ],
  }).lean();
  return Boolean(friendship);
}

export async function sendDirectMessage(userId: string, recipientId: string, content: string) {
  if (userId === recipientId) {
    throw new HttpError(400, 'CANNOT_DM_SELF', 'You cannot message yourself');
  }
  if (!(await areFriends(userId, recipientId))) {
    throw new HttpError(403, 'NOT_FRIENDS', 'You can only message friends');
  }

  const trimmed = content.trim().slice(0, 1000);
  if (!trimmed) throw new HttpError(400, 'VALIDATION_ERROR', 'Message content cannot be empty');

  const message = await DirectMessage.create({
    senderId: toObjectId(userId),
    recipientId: toObjectId(recipientId),
    content: trimmed,
  });

  const sender = await User.findById(userId).select('displayName avatar').lean();

  try {
    const conversationId = getDirectMessageRoomId(userId, recipientId);
    const payload = {
      message: message.toJSON(),
      conversationId,
      sender: {
        _id: String(sender?._id ?? ''),
        displayName: sender?.displayName ?? 'Unknown',
        avatar: sender?.avatar ?? '',
      },
    };
    getIO().to(conversationId).emit('dm:message', payload);
    getIO().to(`user_${recipientId}`).emit('dm:message', payload);
  } catch {
    // best-effort socket broadcast
  }

  return message.toJSON();
}

export async function getConversation(userId: string, otherId: string, page = 1, limit = 50) {
  if (!(await areFriends(userId, otherId))) {
    throw new HttpError(403, 'NOT_FRIENDS', 'You can only view messages with friends');
  }

  const senderObjectId = toObjectId(userId);
  const otherObjectId = toObjectId(otherId);
  const skip = (Math.max(1, page) - 1) * Math.min(50, Math.max(1, limit));

  const filter = {
    $or: [
      { senderId: senderObjectId, recipientId: otherObjectId },
      { senderId: otherObjectId, recipientId: senderObjectId },
    ],
    isDeleted: false,
  };

  const [messages, total] = await Promise.all([
    DirectMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'displayName avatar')
      .lean(),
    DirectMessage.countDocuments(filter),
  ]);

  return {
    conversationId: getDirectMessageRoomId(userId, otherId),
    messages: messages.reverse(),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getConversations(userId: string) {
  const userObjectId = toObjectId(userId);

  const conversations = await DirectMessage.aggregate<{
    _id: Types.ObjectId;
    otherUserId: Types.ObjectId;
    lastMessage: unknown;
    unreadCount: number;
  }>([
    {
      $match: {
        isDeleted: false,
        $or: [{ senderId: userObjectId }, { recipientId: userObjectId }],
      },
    },
    {
      $project: {
        senderId: 1,
        recipientId: 1,
        content: 1,
        readAt: 1,
        createdAt: 1,
        otherUserId: {
          $cond: [{ $eq: ['$senderId', userObjectId] }, '$recipientId', '$senderId'],
        },
        isFromOther: { $ne: ['$senderId', userObjectId] },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$otherUserId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: { $cond: [{ $and: ['$isFromOther', { $eq: ['$readAt', null] }] }, 1, 0] },
        },
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
  ]);

  const otherIds = conversations.map((c) => c._id);
  const users = await User.find({ _id: { $in: otherIds } })
    .select('displayName avatar location.city lastActive gamification.level')
    .lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  return conversations.map((c) => {
    const other = userMap.get(String(c._id));
    const last = c.lastMessage as unknown as {
      content: string;
      createdAt: Date;
      isFromOther: boolean;
    };
    return {
      otherUserId: String(c._id),
      otherUser: {
        _id: String(other?._id ?? ''),
        displayName: other?.displayName ?? 'Unknown',
        avatar: other?.avatar ?? '',
        city: other?.location?.city ?? '',
        level: other?.gamification?.level ?? 1,
      },
      lastMessage: last.content,
      lastMessageAt: new Date(last.createdAt).toISOString(),
      unreadCount: c.unreadCount,
    };
  });
}

export async function markConversationRead(userId: string, otherId: string) {
  await DirectMessage.updateMany(
    {
      senderId: toObjectId(otherId),
      recipientId: toObjectId(userId),
      readAt: null,
    },
    { $set: { readAt: new Date() } },
  );
  return { success: true };
}

export async function getUnreadDmCount(userId: string) {
  return DirectMessage.countDocuments({
    recipientId: toObjectId(userId),
    readAt: null,
    isDeleted: false,
  });
}
