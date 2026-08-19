import Bull from 'bull';
import { Connection, Message, User, Notification } from '../models';
import { createNotification } from './notification';
import { getIO } from '../config/socket';
import mongoose from 'mongoose';

export const inboxQueue = new Bull('inbox-notifications', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
  },
});

export type InboxNotificationJobType = 'send_message_notification' | 'send_digest_notification';

interface MessageNotificationJob {
  recipientId: string;
  senderId: string;
  connectionId: string;
  messagePreview: string;
}

interface DigestJob {
  userId: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Queue a message notification for delivery.
 * Processed asynchronously by the job handler.
 */
export async function queueMessageNotification(job: MessageNotificationJob) {
  try {
    await inboxQueue.add('send_message_notification', job, {
      delay: 0,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    return { queued: true };
  } catch (error) {
    console.error('Failed to queue message notification:', error);
    throw error;
  }
}

/**
 * Queue a daily digest notification for a user.
 * Collects unread message counts and digests them into a single notification.
 */
export async function queueDigestNotification(userId: string) {
  try {
    await inboxQueue.add('send_digest_notification', { userId } as DigestJob, {
      delay: 1000 * 60 * 5, // 5 minutes batching window
      attempts: 2,
      backoff: { type: 'exponential', delay: 3000 },
    });
    return { queued: true };
  } catch (error) {
    console.error('Failed to queue digest notification:', error);
    throw error;
  }
}

/**
 * Process message notifications: create in-app notification and emit real-time event.
 */
async function processMessageNotification(job: Bull.Job<MessageNotificationJob>) {
  const { recipientId, senderId, connectionId, messagePreview } = job.data;

  try {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(recipientId) || !mongoose.Types.ObjectId.isValid(senderId)) {
      throw new Error('Invalid user IDs');
    }

    // Fetch sender info
    const sender = await User.findById(senderId).select('displayName').lean();
    if (!sender) throw new Error('Sender not found');

    // Create in-app notification
    const message = `New message from ${sender.displayName}: "${messagePreview}..."`;
    await createNotification({
      userId: recipientId,
      type: 'new_message',
      message,
      referenceId: connectionId,
      referenceModel: 'Connection',
    });

    // Emit real-time event for instant badge/toast
    try {
      getIO().to(`user_${recipientId}`).emit('inbox:message_received', {
        senderId,
        conversationId: connectionId,
        conversationType: 'skill',
        senderName: sender.displayName,
        preview: messagePreview,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Socket.IO may not be available in job context
    }

    return { success: true, recipientId, connectionId };
  } catch (error) {
    console.error(`Error processing message notification for ${recipientId}:`, error);
    throw error;
  }
}

/**
 * Process digest notifications: aggregate unread messages into a single notification.
 */
async function processDigestNotification(job: Bull.Job<DigestJob>) {
  const { userId } = job.data;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Count unread messages in the past 24 hours
    const unreadMessages = await Message.countDocuments({
      senderId: { $ne: userObjectId },
      readAt: null,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (unreadMessages === 0) {
      return { success: true, userId, digestCount: 0, skipped: true };
    }

    // Fetch top unread conversations
    const topConversations = await Message.aggregate([
      {
        $match: {
          senderId: { $ne: userObjectId },
          readAt: null,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: '$connectionId',
          count: { $sum: 1 },
          lastMessage: { $first: '$content' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    if (topConversations.length === 0) {
      return { success: true, userId, digestCount: 0, skipped: true };
    }

    // Build digest message
    const conversationSummary = topConversations
      .map((conv) => `${conv.count} message${conv.count > 1 ? 's' : ''}`)
      .join(', ');

    const message = `You have ${unreadMessages} unread message${unreadMessages > 1 ? 's' : ''} (${conversationSummary})`;

    // Create digest notification
    await createNotification({
      userId,
      type: 'new_message',
      message,
      referenceModel: 'Connection',
    });

    return { success: true, userId, digestCount: unreadMessages };
  } catch (error) {
    console.error(`Error processing digest notification for ${userId}:`, error);
    throw error;
  }
}

/**
 * Register job processors and error handlers.
 */
export function setupInboxNotificationHandlers() {
  // Process message notifications
  inboxQueue.process('send_message_notification', 10, async (job) => {
    return processMessageNotification(job);
  });

  // Process digest notifications
  inboxQueue.process('send_digest_notification', 5, async (job) => {
    return processDigestNotification(job);
  });

  // Global error handler
  inboxQueue.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed:`, err.message);
  });

  // Global completion handler
  inboxQueue.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  console.log('Inbox notification handlers initialized');
}
