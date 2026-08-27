import mongoose, { Types } from 'mongoose';
import Connection from './Connection';
import Skill from './Skill';
import User from './User';
import UserInboxPreference from './UserInboxPreference.model';

export interface ConversationSummary {
  connectionId: Types.ObjectId;
  connectionStatus: string;
  otherUser: {
    _id: Types.ObjectId;
    displayName: string;
    avatar: string;
    isOnline: boolean;
    lastSeen?: Date;
  };
  skill: {
    _id: Types.ObjectId;
    name: string;
    category: string;
  };
  lastMessage: {
    content: string;
    senderId: Types.ObjectId;
    createdAt: Date;
    type: string;
    isDeleted: boolean;
  } | null;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
}

const Conversation = {
  async getForUser(userId: string, options: { page?: number; limit?: number; filter?: 'all' | 'unread' | 'archived' | 'pinned' } = {}) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { conversations: [], totalUnread: 0, meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    }

    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
    const skip = (page - 1) * limit;
    const filter = options.filter || 'all';

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const connected = await Connection.aggregate([
      {
        $match: {
          $or: [{ requesterId: userObjectId }, { teacherId: userObjectId }],
          status: { $in: ['accepted', 'completed'] },
        },
      },
      {
        $lookup: {
          from: 'messages',
          let: { connectionId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$connectionId', '$$connectionId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                content: 1,
                senderId: 1,
                createdAt: 1,
                type: 1,
                deletedAt: 1,
                isDeleted: { $ne: ['$deletedAt', null] },
              },
            },
          ],
          as: 'lastMessageDoc',
        },
      },
      {
        $lookup: {
          from: 'messages',
          let: { connectionId: '$_id', currentUser: userObjectId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$connectionId', '$$connectionId'] },
                    { $ne: ['$senderId', '$$currentUser'] },
                    { $eq: ['$readAt', null] },
                  ],
                },
              },
            },
            { $count: 'count' },
          ],
          as: 'unreadDocs',
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { otherUserId: { $cond: [{ $eq: ['$requesterId', userObjectId] }, '$teacherId', '$requesterId'] } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$otherUserId'] } } },
            { $project: { _id: 1, displayName: 1, avatar: 1 } },
          ],
          as: 'otherUserDoc',
        },
      },
      {
        $lookup: {
          from: 'skills',
          let: { skillId: '$skillId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$skillId'] } } },
            { $project: { _id: 1, name: 1, category: 1 } },
          ],
          as: 'skillDoc',
        },
      },
      {
        $addFields: {
          lastMessage: { $ifNull: [{ $arrayElemAt: ['$lastMessageDoc', 0] }, null] },
          unreadCount: { $ifNull: [{ $arrayElemAt: ['$unreadDocs.count', 0] }, 0] },
          otherUser: { $ifNull: [{ $arrayElemAt: ['$otherUserDoc', 0] }, null] },
          skill: { $ifNull: [{ $arrayElemAt: ['$skillDoc', 0] }, null] },
        },
      },
    ]).exec();

    const preferences = await UserInboxPreference.find({ userId: userObjectId }).lean();
    const prefMap = new Map<string, any>();
    for (const pref of preferences) {
      prefMap.set(String(pref.connectionId), pref);
    }

    const summaries = await Promise.all(
      connected.map(async (connection: any) => {
        const pref = prefMap.get(String(connection._id)) ?? {};
        const otherUser = connection.otherUser ?? {
          _id: null,
          displayName: 'Unknown user',
          avatar: '',
        };
        const skill = connection.skill ?? { _id: null, name: 'Skill', category: 'General' };
        const lastMessage = connection.lastMessage ? {
          content: String(connection.lastMessage.content ?? '').slice(0, 80),
          senderId: connection.lastMessage.senderId,
          createdAt: connection.lastMessage.createdAt,
          type: connection.lastMessage.type || 'text',
          isDeleted: Boolean(connection.lastMessage.isDeleted),
        } : null;

        return {
          connectionId: connection._id,
          connectionStatus: connection.status,
          otherUser: {
            _id: otherUser._id,
            displayName: otherUser.displayName || 'User',
            avatar: otherUser.avatar || '',
            isOnline: false,
          },
          skill: {
            _id: skill._id,
            name: skill.name || 'Skill',
            category: skill.category || 'General',
          },
          lastMessage,
          unreadCount: Number(connection.unreadCount ?? 0),
          isPinned: Boolean(pref.isPinned),
          isMuted: Boolean(pref.isMuted),
        } as ConversationSummary;
      })
    );

    const grouped = new Map<string, ConversationSummary>();
    for (const s of summaries) {
      const key = String(s.otherUser._id);
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, s);
      } else {
        existing.unreadCount += s.unreadCount;
        if (!existing.isPinned && s.isPinned) existing.isPinned = true;
        if (!existing.isMuted && s.isMuted) existing.isMuted = true;
        const existingTime = existing.lastMessage?.createdAt ? new Date(existing.lastMessage.createdAt).getTime() : 0;
        const newTime = s.lastMessage?.createdAt ? new Date(s.lastMessage.createdAt).getTime() : 0;
        if (newTime > existingTime) {
          existing.connectionId = s.connectionId;
          existing.lastMessage = s.lastMessage;
        }
      }
    }

    let filtered = Array.from(grouped.values());
    if (filter === 'unread') filtered = filtered.filter((c) => c.unreadCount > 0);
    if (filter === 'pinned') filtered = filtered.filter((c) => c.isPinned);
    if (filter === 'archived') filtered = filtered.filter((c) => Boolean((prefMap.get(String(c.connectionId)) as any)?.isArchived));

    filtered = filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return Number(b.isPinned) - Number(a.isPinned);
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    const totalUnread = filtered.reduce((sum, item) => sum + item.unreadCount, 0);
    const paged = filtered.slice(skip, skip + limit);

    return {
      conversations: paged,
      totalUnread,
      meta: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      },
    };
  },

  async getTotalUnread(userId: string) {
    const result = await this.getForUser(userId, { page: 1, limit: 1000, filter: 'all' });
    return result.totalUnread;
  },
};

export default Conversation;
