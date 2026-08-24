import { Types } from 'mongoose';
import { Notification, User } from '../models';
import type { NotificationType } from '../models';
import { HttpError } from '../utils/errors';
import { getIO } from '../config/socket';
import { isInQuietHours } from './user';

const URGENT_TYPES = new Set<NotificationType>([
  'new_message',
  'request_received',
  'request_accepted',
  'request_rejected',
]);

function toObjectId(value: string | Types.ObjectId): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

export async function createNotification(input: {
  userId: string | Types.ObjectId;
  type: NotificationType;
  message: string;
  referenceId?: string | Types.ObjectId;
  referenceModel?: string;
}) {
  const notification = await Notification.create({
    userId: toObjectId(input.userId),
    type: input.type,
    message: input.message.slice(0, 300),
    referenceId: input.referenceId !== undefined && Types.ObjectId.isValid(input.referenceId)
      ? new Types.ObjectId(input.referenceId)
      : undefined,
    referenceModel: input.referenceModel,
  });

  try {
    let quiet = false;
    if (!URGENT_TYPES.has(input.type)) {
      const recipient = await User.findById(input.userId).select('quietHours').lean();
      quiet = isInQuietHours(recipient?.quietHours ?? { enabled: false, startTime: '', endTime: '', timezone: '' });
    }
    if (!quiet) {
      getIO().to(`user_${String(input.userId)}`).emit('notification:new', notification.toJSON());
    }
  } catch {
    // Socket.IO not initialized (e.g. during tests or job processing)
  }

  return notification;
}

export async function getNotifications(userId: string, page = 1, limit = 20) {
  const skip = (Math.max(1, page) - 1) * limit;
  // Chat messages live in the chat UI only — never in the general feed.
  const filter = { userId: new Types.ObjectId(userId), type: { $ne: 'new_message' as const } };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);

  return {
    notifications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    unreadCount,
  };
}

export async function markAsRead(notificationId: string, userId: string) {
  const id = toObjectId(notificationId);
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: new Types.ObjectId(userId) },
    { $set: { isRead: true } },
    { new: true },
  );
  if (!notification) throw new HttpError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
  return notification.toJSON();
}

export async function markAsUnread(notificationId: string, userId: string) {
  const id = toObjectId(notificationId);
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: new Types.ObjectId(userId) },
    { $set: { isRead: false } },
    { new: true },
  );
  if (!notification) throw new HttpError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
  return notification.toJSON();
}

export async function markAllAsRead(userId: string) {
  await Notification.updateMany(
    { userId: new Types.ObjectId(userId), isRead: false },
    { $set: { isRead: true } },
  );
  return { success: true };
}

export async function getUnreadCount(userId: string, types?: string[]) {
  const match: Record<string, unknown> = {
    userId: new Types.ObjectId(userId),
    isRead: false,
  };
  if (types?.length) {
    match.type = { $in: types };
  } else {
    // Chat messages surface in the chat UI, not the notification bell.
    match.type = { $ne: 'new_message' };
  }
  return Notification.countDocuments(match);
}
