import mongoose, { Types } from 'mongoose';
import type { Server } from 'socket.io';
import { Message, Connection, Friendship, User, ConversationSettings, Block } from '../models';
import type {
  IMessageDocument,
  MessageType,
  ReactionEmoji,
  SystemMessageEvent,
  ISkillCardData,
} from '../models';
import { HttpError } from '../utils/errors';
import { sanitizeText } from '../utils/sanitize';
import { getRedis } from '../config/redis';
import { getDirectMessageRoomId } from './friendship';
import { isUserOnline, getLastSeen } from './presence';
import { createNotification } from './notification';
import { isInQuietHours } from './user';

export type ConversationType = 'skill' | 'friend';
export type MessageStatus = 'sent' | 'delivered' | 'read';

const CONVERSATION_CACHE_PREFIX = 'conversation:';
const CONVERSATION_CACHE_TTL_SECONDS = 60;
const UNREAD_PREFIX = 'unread:';
const DRAFT_PREFIX = 'draft:';
const DRAFT_TTL_SECONDS = 7 * 24 * 60 * 60;
const MAX_CONTENT_LENGTH = 2000;
const MAX_DRAFT_LENGTH = 2000;
const EDIT_WINDOW_MS = 5 * 60 * 1000;
const DELETE_WINDOW_MS = 5 * 60 * 1000;
const ALLOWED_EMOJIS: readonly ReactionEmoji[] = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥'];

export const REACTION_EMOJIS = ALLOWED_EMOJIS;

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Cooking': '#F97316',
  'Gardening': '#22C55E',
  'Home & Repair': '#3B82F6',
  'Crafts': '#EC4899',
  'Digital': '#8B5CF6',
  'Wellness': '#14B8A6',
  'Language': '#F59E0B',
  'Arts & Music': '#EF4444',
  'Sports': '#10B981',
  'General': '#64748B',
};

export interface MessengerParticipant {
  userId: string;
  displayName: string;
  avatarUrl: string;
  isOnline: boolean;
  lastSeen: string | null;
  isTyping: boolean;
}

export interface SkillContextSummary {
  skillId: string;
  skillName: string;
  skillCategory: string;
  connectionStatus: string;
  categoryColor: string;
}

export interface LastMessageSummary {
  messageId: string;
  senderId: string;
  content: string | null;
  type: string;
  createdAt: string;
  isDeleted: boolean;
}

export interface ConversationSummary {
  conversationId: string;
  conversationType: ConversationType;
  participants: MessengerParticipant[];
  skillContext?: SkillContextSummary;
  lastMessage: LastMessageSummary | null;
  unreadCount: number;
  lastReadMessageId: string | null;
  isPinned: boolean;
  pinnedAt: string | null;
  isMuted: boolean;
  mutedUntil: string | null;
  isArchived: boolean;
  deletedAt: string | null;
  updatedAt: string;
}

export interface ReactionDTO {
  userId: string;
  emoji: ReactionEmoji;
  createdAt: string;
}

export interface MessengerMessageDTO {
  _id: string;
  conversationId: string;
  conversationType: ConversationType;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string | null;
  type: MessageType;
  reactions: ReactionDTO[];
  readAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  editedAt: string | null;
  replyToMessageId: string | null;
  replyToPreview: { senderId: string; senderName: string; contentPreview: string } | null;
  isDeleted: boolean;
  isMine: boolean;
  imageUrl?: string;
  imageThumbnailUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  gifUrl?: string;
  gifWidth?: number;
  gifHeight?: number;
  skillCardData?: ISkillCardData;
  voiceNoteUrl?: string;
  voiceNoteDurationSeconds?: number;
  voiceNoteWaveform?: number[];
  systemEvent?: SystemMessageEvent;
  status: MessageStatus;
}

export interface ConversationContext {
  conversationId: string;
  conversationType: ConversationType;
  participantIds: string[];
  roomIds: string[];
  skillContext?: SkillContextSummary;
}

interface ParticipantSummary {
  userId: string;
  displayName: string;
  avatarUrl: string;
}

function assertValidObjectId(value: unknown, label = 'id'): Types.ObjectId {
  if (!value || !mongoose.Types.ObjectId.isValid(String(value))) {
    throw new HttpError(400, 'INVALID_ID', `${label} is not a valid MongoDB ObjectId`);
  }
  return new mongoose.Types.ObjectId(String(value));
}

function truncate(content: string, max = 60): string {
  return content.length > max ? `${content.slice(0, max)}…` : content;
}

async function getSettings(userId: string, conversationId: string): Promise<Record<string, any> | null> {
  const settings = await ConversationSettings.findOne({
    userId: assertValidObjectId(userId, 'userId'),
    conversationId,
  }).lean();
  return settings ?? null;
}

async function getUnreadCountRedis(userId: string, conversationId: string): Promise<number> {
  const redis = await getRedis();
  if (!redis) return 0;
  try {
    const raw = await redis.get(`${UNREAD_PREFIX}${userId}:${conversationId}`);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export async function incrementUnread(recipientUserId: string, conversationId: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  try {
    await redis.incr(`${UNREAD_PREFIX}${recipientUserId}:${conversationId}`);
  } catch {
    // best-effort
  }
}

export async function resetUnread(userId: string, conversationId: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  try {
    await redis.set(`${UNREAD_PREFIX}${userId}:${conversationId}`, '0');
  } catch {
    // best-effort
  }
}

export async function getTotalUnread(userId: string): Promise<number> {
  const redis = await getRedis();
  if (!redis) return 0;
  try {
    const keys = await redis.keys(`${UNREAD_PREFIX}${userId}:*`);
    if (!keys.length) return 0;
    const values = await redis.mGet(keys);
    return values.reduce((sum, value) => sum + (value ? Number(value) : 0), 0);
  } catch {
    return 0;
  }
}

export async function saveDraft(userId: string, conversationId: string, content: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  const trimmed = content.slice(0, MAX_DRAFT_LENGTH);
  try {
    await redis.setEx(`${DRAFT_PREFIX}${userId}:${conversationId}`, DRAFT_TTL_SECONDS, trimmed);
  } catch {
    // best-effort
  }
}

export async function getDraft(userId: string, conversationId: string): Promise<string> {
  const redis = await getRedis();
  if (!redis) return '';
  try {
    return (await redis.get(`${DRAFT_PREFIX}${userId}:${conversationId}`)) ?? '';
  } catch {
    return '';
  }
}

export async function clearDraft(userId: string, conversationId: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  try {
    await redis.del(`${DRAFT_PREFIX}${userId}:${conversationId}`);
  } catch {
    // best-effort
  }
}

export async function invalidateConversationCache(userId: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  try {
    await redis.del(`${CONVERSATION_CACHE_PREFIX}${userId}`);
  } catch {
    // best-effort
  }
}

export async function publishConversationUpdated(
  io: Server,
  participantIds: string[],
  conversationId: string
): Promise<void> {
  for (const participantId of participantIds) {
    try {
      const list = await getConversationList(participantId);
      const matching = list.find((s) => s.conversationId === conversationId);
      if (matching) {
        io.to(`user_${participantId}`).emit('messenger:conversation_updated', { conversation: matching });
      }
    } catch {
      // best-effort
    }
  }
}

export async function publishUnreadTotals(io: Server, userIds: string[]): Promise<void> {
  for (const userId of userIds) {
    const total = await getTotalUnread(userId);
    io.to(`user_${userId}`).emit('messenger:unread_total_updated', { total });
  }
}

export async function sendMessageAndNotify(io: Server, params: {
  senderId: string;
  conversationId: string;
  conversationType: ConversationType;
  content?: string;
  type?: 'text' | 'gif';
  gifUrl?: string;
  gifWidth?: number;
  gifHeight?: number;
  replyToMessageId?: string;
}): Promise<{ dto: MessengerMessageDTO; context: ConversationContext; isShadowBanned: boolean }> {
  const context = await getConversationContext(params.senderId, params.conversationId, params.conversationType);
  const sender = await User.findById(params.senderId).select('isShadowBanned status').lean();
  if (!sender) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  if (sender.status !== 'active') throw new HttpError(403, 'ACCOUNT_SUSPENDED', 'Your account is suspended');

  const dto = await sendMessage(params);

  const isShadowBanned = Boolean(sender.isShadowBanned);
  if (!isShadowBanned) {
    for (const roomId of context.roomIds) {
      io.to(roomId).emit('messenger:message_received', { message: dto });
    }
  }

  for (const participantId of context.participantIds) {
    await reviveConversation({
      userId: participantId,
      conversationId: params.conversationId,
      conversationType: params.conversationType,
    });
  }

  await publishConversationUpdated(io, context.participantIds, params.conversationId);
  await publishUnreadTotals(io, context.participantIds);

  return { dto, context, isShadowBanned };
}

export async function getConversationContext(
  userId: string,
  conversationId: string,
  conversationType: ConversationType
): Promise<ConversationContext> {
  if (conversationType === 'friend') {
    const friendship = await Friendship.findById(assertValidObjectId(conversationId, 'conversationId')).lean();
    if (!friendship) {
      throw new HttpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
    }
    const requesterId = String(friendship.requesterId);
    const addresseeId = String(friendship.addresseeId);
    const isParticipant = userId === requesterId || userId === addresseeId;
    if (!isParticipant) {
      throw new HttpError(403, 'NOT_PARTICIPANT', 'You are not part of this conversation');
    }
    const blocked = await Block.findOne({
      $or: [
        { blockerId: userId, blockedId: requesterId },
        { blockerId: userId, blockedId: addresseeId },
        { blockerId: requesterId, blockedId: userId },
        { blockerId: addresseeId, blockedId: userId },
      ],
    }).lean();
    if (blocked && String(blocked.blockerId) === userId) {
      throw new HttpError(403, 'USER_BLOCKED', 'Unable to open conversation');
    }
    return {
      conversationId,
      conversationType: 'friend',
      participantIds: [requesterId, addresseeId],
      roomIds: [getDirectMessageRoomId(requesterId, addresseeId), `dm_${conversationId}`],
    };
  }

  const connection = await Connection.findById(assertValidObjectId(conversationId, 'conversationId')).lean();
  if (!connection) {
    throw new HttpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
  }
  const requesterId = String(connection.requesterId);
  const teacherId = String(connection.teacherId);
  const isParticipant = userId === requesterId || userId === teacherId;
  if (!isParticipant) {
    throw new HttpError(403, 'NOT_PARTICIPANT', 'You are not part of this conversation');
  }
  const blocked = await Block.findOne({
    $or: [
      { blockerId: userId, blockedId: requesterId },
      { blockerId: userId, blockedId: teacherId },
      { blockerId: requesterId, blockedId: userId },
      { blockerId: teacherId, blockedId: userId },
    ],
  }).lean();
if (blocked && String(blocked.blockerId) === userId) {
      throw new HttpError(403, 'USER_BLOCKED', 'Unable to open conversation');
    }
    return {
      conversationId,
      conversationType: 'skill',
    participantIds: [requesterId, teacherId],
    roomIds: [`chat_${conversationId}`],
  };
}

function buildSummary(
  conversationId: string,
  conversationType: ConversationType,
  participants: ParticipantSummary[],
  skillContext: SkillContextSummary | undefined,
  settings: Record<string, any> | null,
  unreadCount: number,
  lastMessage: LastMessageSummary | null,
  updatedAt: Date
): ConversationSummary {
  return {
    conversationId,
    conversationType,
    participants: participants.map((p) => ({
      userId: p.userId,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
      isOnline: false,
      lastSeen: null,
      isTyping: false,
    })),
    skillContext,
    lastMessage,
    unreadCount,
    lastReadMessageId: settings?.lastReadMessageId ? String(settings.lastReadMessageId) : null,
    isPinned: Boolean(settings?.isPinned),
    pinnedAt: settings?.pinnedAt ? new Date(settings.pinnedAt).toISOString() : null,
    isMuted: Boolean(settings?.isMuted),
    mutedUntil: settings?.mutedUntil ? new Date(settings.mutedUntil).toISOString() : null,
    isArchived: Boolean(settings?.isArchived),
    deletedAt: settings?.deletedAt ? new Date(settings.deletedAt).toISOString() : null,
    updatedAt: updatedAt.toISOString(),
  };
}

export async function getConversationList(userId: string): Promise<ConversationSummary[]> {
  const redis = await getRedis();
  if (redis) {
    try {
      const cached = await redis.get(`${CONVERSATION_CACHE_PREFIX}${userId}`);
      if (cached) return JSON.parse(cached) as ConversationSummary[];
    } catch {
      // fall through
    }
  }

  const userObjectId = assertValidObjectId(userId, 'userId');

  const [connections, friendships, allSettings, allLastMessages, senderNames] = await Promise.all([
    Connection.find({
      status: { $in: ['accepted', 'completed'] },
      $or: [{ requesterId: userObjectId }, { teacherId: userObjectId }],
    })
      .select('_id status requesterId teacherId skillId updatedAt')
      .lean(),
    Friendship.find({
      status: 'accepted',
      $or: [{ requesterId: userObjectId }, { addresseeId: userObjectId }],
    })
      .select('_id requesterId addresseeId directMessageRoomId updatedAt')
      .lean(),
    ConversationSettings.find({ userId: userObjectId }).lean(),
    Message.aggregate<{
      _id: { conversationId: mongoose.Types.ObjectId; conversationType: ConversationType };
      last: IMessageDocument | null;
    }>([
      {
        $match: {
          unsentAt: null,
          $or: [
            { connectionId: { $exists: true } },
            { friendshipId: { $exists: true } },
          ],
        },
      },
      {
        $addFields: {
          conversationId: { $ifNull: ['$connectionId', '$friendshipId'] },
          conversationType: { $cond: [{ $ifNull: ['$connectionId', null] }, 'skill', 'friend'] },
        },
      },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $group: {
          _id: { conversationId: '$conversationId', conversationType: '$conversationType' },
          last: { $first: '$$ROOT' },
        },
      },
    ]),
    User.find({ _id: userObjectId }).select('displayName avatar').lean(),
  ]);

  const myInfo = senderNames[0] as { _id: Types.ObjectId; displayName: string; avatar: string } | undefined;

  const otherUserIds = new Set<string>();
  for (const c of connections) {
    otherUserIds.add(String(c.requesterId));
    otherUserIds.add(String(c.teacherId));
    if (c.skillId) otherUserIds.add(String(c.skillId));
  }
  for (const f of friendships) {
    otherUserIds.add(String(f.requesterId));
    otherUserIds.add(String(f.addresseeId));
  }

  const [otherUsers, skills] = await Promise.all([
    User.find({ _id: { $in: [...otherUserIds] } })
      .select('displayName avatar')
      .lean(),
    connections.length > 0
      ? Connection.aggregate([
          { $match: { _id: { $in: connections.map((c) => c._id) } } },
          {
            $lookup: {
              from: 'skills',
              let: { skillId: '$skillId' },
              pipeline: [
                { $match: { $expr: { $eq: ['$_id', '$$skillId'] } } },
                { $project: { _id: 1, skillName: 1, categoryName: 1 } },
              ],
              as: 'skillDoc',
            },
          },
          {
            $project: {
              connectionId: '$_id',
              status: 1,
              skillName: { $arrayElemAt: ['$skillDoc.skillName', 0] },
              categoryName: { $arrayElemAt: ['$skillDoc.categoryName', 0] },
            },
          },
        ])
      : Promise.resolve([]),
  ]);

  const userMap = new Map<string, { displayName: string; avatar: string }>();
  for (const u of otherUsers) {
    userMap.set(String(u._id), { displayName: u.displayName, avatar: u.avatar ?? '' });
  }
  if (myInfo) userMap.set(String(myInfo._id), { displayName: myInfo.displayName, avatar: myInfo.avatar });

  const skillMap = new Map<string, { skillName: string; categoryName: string; status: string }>();
  for (const s of skills as Array<{ connectionId: Types.ObjectId; status: string; skillName?: string; categoryName?: string }>) {
    skillMap.set(String(s.connectionId), {
      skillName: s.skillName ?? 'Skill',
      categoryName: s.categoryName ?? 'General',
      status: s.status,
    });
  }

  const settingsMap = new Map<string, Record<string, any>>();
  for (const s of allSettings) {
    settingsMap.set(s.conversationId, s);
  }

  const lastMessageMap = new Map<string, LastMessageSummary | null>();

  for (const group of allLastMessages) {
    const key = `${group._id.conversationType}:${String(group._id.conversationId)}`;
    const msg = group.last;
    if (!msg) {
      lastMessageMap.set(key, null);
      continue;
    }
    lastMessageMap.set(key, {
      messageId: String(msg._id),
      senderId: String(msg.senderId),
      content: msg.deletedAt ? null : truncate(msg.content ?? ''),
      type: msg.type,
      createdAt: new Date(msg.createdAt).toISOString(),
      isDeleted: Boolean(msg.deletedAt),
    });
  }

  const summaries: ConversationSummary[] = [];

  for (const c of connections) {
    const conversationId = String(c._id);
    const requesterId = String(c.requesterId);
    const teacherId = String(c.teacherId);
    const skillInfo = skillMap.get(conversationId);
    const settings = settingsMap.get(conversationId) ?? null;
    const last = lastMessageMap.get(`skill:${conversationId}`) ?? null;

    const participants: ParticipantSummary[] = [
      { userId: requesterId, displayName: userMap.get(requesterId)?.displayName ?? 'User', avatarUrl: userMap.get(requesterId)?.avatar ?? '' },
      { userId: teacherId, displayName: userMap.get(teacherId)?.displayName ?? 'User', avatarUrl: userMap.get(teacherId)?.avatar ?? '' },
    ];

    const skillContext: SkillContextSummary = {
      skillId: String(c.skillId),
      skillName: skillInfo?.skillName ?? 'Skill',
      skillCategory: skillInfo?.categoryName ?? 'General',
      connectionStatus: skillInfo?.status ?? c.status,
      categoryColor: CATEGORY_COLORS[skillInfo?.categoryName ?? 'General'] ?? CATEGORY_COLORS['General'],
    };

    summaries.push(
      buildSummary(
        conversationId,
        'skill',
        participants,
        skillContext,
        settings,
        await getUnreadCountRedis(userId, conversationId),
        last,
        new Date(c.updatedAt ?? c.createdAt ?? Date.now())
      )
    );
  }

  for (const f of friendships) {
    const conversationId = String(f._id);
    const requesterId = String(f.requesterId);
    const addresseeId = String(f.addresseeId);
    const settings = settingsMap.get(conversationId) ?? null;
    const last = lastMessageMap.get(`friend:${conversationId}`) ?? null;

    const participants: ParticipantSummary[] = [
      { userId: requesterId, displayName: userMap.get(requesterId)?.displayName ?? 'User', avatarUrl: userMap.get(requesterId)?.avatar ?? '' },
      { userId: addresseeId, displayName: userMap.get(addresseeId)?.displayName ?? 'User', avatarUrl: userMap.get(addresseeId)?.avatar ?? '' },
    ];

    summaries.push(
      buildSummary(
        conversationId,
        'friend',
        participants,
        undefined,
        settings,
        await getUnreadCountRedis(userId, conversationId),
        last,
        new Date(f.updatedAt ?? f.createdAt ?? Date.now())
      )
    );
  }

  const summariesWithPresence = await Promise.all(
    summaries.map(async (s) => {
      const withPresence = await Promise.all(
        s.participants.map(async (p) => {
          const isOnline = await isUserOnline(p.userId);
          const lastSeen = await getLastSeen(p.userId);
          return {
            ...p,
            isOnline,
            lastSeen: lastSeen ? lastSeen.toISOString() : null,
          };
        })
      );
      return { ...s, participants: withPresence };
    })
  );

  const sorted = summariesWithPresence
    .filter((s) => !s.isArchived && !s.deletedAt)
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return Number(b.isPinned) - Number(a.isPinned);
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt).getTime();
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt).getTime();
      return bTime - aTime;
    });

  if (redis) {
    try {
      await redis.setEx(`${CONVERSATION_CACHE_PREFIX}${userId}`, CONVERSATION_CACHE_TTL_SECONDS, JSON.stringify(sorted));
    } catch {
      // best-effort
    }
  }

  return sorted;
}

async function toMessageDTO(
  message: IMessageDocument,
  viewerId: string,
  conversationId: string,
  conversationType: ConversationType
): Promise<MessengerMessageDTO> {
  const sender = await User.findById(message.senderId).select('displayName avatar').lean();
  const isMine = String(message.senderId) === viewerId;
  const readByOther = Boolean(message.readAt);

  return {
    _id: String(message._id),
    conversationId,
    conversationType,
    senderId: String(message.senderId),
    senderName: sender?.displayName ?? 'Unknown',
    senderAvatar: sender?.avatar ?? '',
    content: message.deletedAt ? null : message.content ?? null,
    type: message.type,
    reactions: (message.reactions ?? []).map((r) => ({
      userId: String(r.userId),
      emoji: r.emoji,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    })),
    readAt: message.readAt ? new Date(message.readAt).toISOString() : null,
    deliveredAt: message.deliveredAt ? new Date(message.deliveredAt).toISOString() : null,
    createdAt: new Date(message.createdAt).toISOString(),
    editedAt: message.editedAt ? new Date(message.editedAt).toISOString() : null,
    replyToMessageId: message.replyToMessageId ? String(message.replyToMessageId) : null,
    replyToPreview: message.replyToPreview
      ? {
          senderId: String(message.replyToPreview.senderId),
          senderName: message.replyToPreview.senderName,
          contentPreview: message.replyToPreview.contentPreview,
        }
      : null,
    isDeleted: Boolean(message.deletedAt),
    isMine,
    imageUrl: message.imageUrl,
    imageThumbnailUrl: message.imageThumbnailUrl,
    imageWidth: message.imageWidth,
    imageHeight: message.imageHeight,
    gifUrl: message.gifUrl,
    gifWidth: message.gifWidth,
    gifHeight: message.gifHeight,
    skillCardData: message.skillCardData,
    voiceNoteUrl: message.voiceNoteUrl,
    voiceNoteDurationSeconds: message.voiceNoteDurationSeconds,
    voiceNoteWaveform: message.voiceNoteWaveform,
    systemEvent: message.systemEvent,
    status: readByOther ? 'read' : message.deliveredAt ? 'delivered' : 'sent',
  };
}

export async function getConversationMessages(
  params: {
    userId: string;
    conversationId: string;
    conversationType: ConversationType;
    cursor?: string;
    limit?: number;
  }
): Promise<{ messages: MessengerMessageDTO[]; nextCursor: string | null; hasMore: boolean }> {
  const { userId, conversationId, conversationType } = params;
  await getConversationContext(userId, conversationId, conversationType);

  const limit = Math.min(Math.max(Number(params.limit) || 30, 1), 100);
  const viewerObjectId = assertValidObjectId(userId, 'userId');

  const field = conversationType === 'skill' ? 'connectionId' : 'friendshipId';
  const query: Record<string, unknown> = { [field]: new mongoose.Types.ObjectId(conversationId), unsentAt: null };

  if (params.cursor) {
    try {
      const decoded = Buffer.from(params.cursor, 'base64').toString('utf8');
      const [messageId, isoDate] = decoded.split('|');
      if (!messageId || !isoDate) throw new Error('bad cursor');
      query.createdAt = { $lt: new Date(isoDate) };
      query._id = { $lt: new mongoose.Types.ObjectId(messageId) };
    } catch {
      throw new HttpError(400, 'INVALID_CURSOR', 'Invalid pagination cursor');
    }
  }

  const raw = await Message.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = raw.length > limit;
  const sliced = raw.slice(0, limit);

  const filtered: IMessageDocument[] = [];
  for (const msg of sliced) {
    const sender = await User.findById(msg.senderId).select('isShadowBanned').lean();
    if (sender?.isShadowBanned && String(msg.senderId) !== userId) continue;
    filtered.push(msg as IMessageDocument);
  }

  const messages = await Promise.all(
    filtered.map((msg) => toMessageDTO(msg, userId, conversationId, conversationType))
  );

  const lastMsg = sliced[sliced.length - 1];
  const nextCursor =
    hasMore && lastMsg
      ? Buffer.from(`${String(lastMsg._id)}|${new Date(lastMsg.createdAt).toISOString()}`).toString('base64')
      : null;

  return { messages: messages.reverse(), nextCursor, hasMore };
}

export async function sendMessage(params: {
  senderId: string;
  conversationId: string;
  conversationType: ConversationType;
  content?: string;
  type?: 'text' | 'gif';
  gifUrl?: string;
  gifWidth?: number;
  gifHeight?: number;
  replyToMessageId?: string;
}): Promise<MessengerMessageDTO> {
  const { senderId, conversationId, conversationType } = params;
  const context = await getConversationContext(senderId, conversationId, conversationType);

  const sender = await User.findById(senderId).select('displayName avatar isShadowBanned status').lean();
  if (!sender) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  if (sender.status !== 'active') throw new HttpError(403, 'ACCOUNT_SUSPENDED', 'Your account is suspended');

  const type = params.type || 'text';
  let content = '';

  if (type === 'gif') {
    if (!params.gifUrl) throw new HttpError(400, 'VALIDATION_ERROR', 'GIF messages require a gifUrl');
  } else {
    content = sanitizeText(params.content ?? '');
    if (content.length > MAX_CONTENT_LENGTH) {
      throw new HttpError(422, 'CONTENT_TOO_LONG', `Message must be ${MAX_CONTENT_LENGTH} characters or fewer`);
    }
    if (!content.trim()) throw new HttpError(400, 'EMPTY_MESSAGE', 'Message content cannot be empty');
  }

  const field = conversationType === 'skill' ? 'connectionId' : 'friendshipId';

  let replyToPreview: IMessageDocument['replyToPreview'];
  if (params.replyToMessageId) {
    const replyTo = await Message.findById(params.replyToMessageId).lean();
    if (replyTo) {
      const replySender = await User.findById(replyTo.senderId).select('displayName').lean();
      replyToPreview = {
        senderId: replyTo.senderId,
        senderName: replySender?.displayName ?? 'Unknown',
        contentPreview: truncate(replyTo.content ?? '', 80),
      };
    }
  }

  const message = await Message.create({
    [field]: new mongoose.Types.ObjectId(conversationId),
    senderId: senderId,
    content,
    type,
    gifUrl: type === 'gif' ? params.gifUrl : undefined,
    gifWidth: params.gifWidth,
    gifHeight: params.gifHeight,
    replyToMessageId: params.replyToMessageId ? new mongoose.Types.ObjectId(params.replyToMessageId) : undefined,
    replyToPreview,
    deliveredAt: new Date(),
  });

  const recipientIds = context.participantIds.filter((id) => id !== senderId);

  for (const recipientId of recipientIds) {
    await incrementUnread(recipientId, conversationId);
  }

  const recipient = await User.findOne({ _id: { $in: recipientIds.map((id) => new mongoose.Types.ObjectId(id)) } }).select('quietHours').lean();
  const quiet = isInQuietHours(recipient?.quietHours ?? { enabled: false, startTime: '', endTime: '', timezone: '' });
  for (const recipientId of recipientIds) {
    if (quiet) continue;
    try {
      await createNotification({
        userId: recipientId,
        type: 'new_message',
        message: `New message from ${sender.displayName}`,
        referenceId: message._id,
        referenceModel: 'Message',
      });
    } catch {
      // best-effort
    }
  }

  await invalidateConversationCache(senderId);
  for (const recipientId of recipientIds) {
    await invalidateConversationCache(recipientId);
  }

  const dto = await toMessageDTO(message as IMessageDocument, senderId, conversationId, conversationType);
  return dto;
}

export async function createImageMessage(params: {
  senderId: string;
  conversationId: string;
  conversationType: ConversationType;
  caption?: string;
  imageUrl: string;
  imageThumbnailUrl: string;
  imagePublicId?: string;
  imageWidth?: number;
  imageHeight?: number;
}): Promise<MessengerMessageDTO> {
  const { senderId, conversationId, conversationType } = params;
  const context = await getConversationContext(senderId, conversationId, conversationType);

  const sender = await User.findById(senderId).select('displayName avatar isShadowBanned status').lean();
  if (!sender) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  if (sender.status !== 'active') throw new HttpError(403, 'ACCOUNT_SUSPENDED', 'Your account is suspended');

  const caption = sanitizeText(params.caption ?? '');
  if (caption.length > 500) {
    throw new HttpError(422, 'CONTENT_TOO_LONG', 'Caption must be 500 characters or fewer');
  }

  const field = conversationType === 'skill' ? 'connectionId' : 'friendshipId';
  const message = await Message.create({
    [field]: new mongoose.Types.ObjectId(conversationId),
    senderId,
    content: caption,
    type: 'image',
    imageUrl: params.imageUrl,
    imageThumbnailUrl: params.imageThumbnailUrl,
    imagePublicId: params.imagePublicId,
    imageWidth: params.imageWidth,
    imageHeight: params.imageHeight,
    deliveredAt: new Date(),
  });

  const recipientIds = context.participantIds.filter((id) => id !== senderId);
  for (const recipientId of recipientIds) {
    await incrementUnread(recipientId, conversationId);
  }

  const recipient = await User.findOne({ _id: { $in: recipientIds.map((id) => new mongoose.Types.ObjectId(id)) } }).select('quietHours').lean();
  const quiet = isInQuietHours(recipient?.quietHours ?? { enabled: false, startTime: '', endTime: '', timezone: '' });
  for (const recipientId of recipientIds) {
    if (quiet) continue;
    try {
      await createNotification({
        userId: recipientId,
        type: 'new_message',
        message: `New photo from ${sender.displayName}`,
        referenceId: message._id,
        referenceModel: 'Message',
      });
    } catch {
      // best-effort
    }
  }

  await invalidateConversationCache(senderId);
  for (const recipientId of recipientIds) {
    await invalidateConversationCache(recipientId);
  }

  return toMessageDTO(message as IMessageDocument, senderId, conversationId, conversationType);
}

export async function markConversationRead(params: {
  userId: string;
  conversationId: string;
  conversationType: ConversationType;
  lastReadMessageId?: string;
}): Promise<{ updatedCount: number }> {
  const { userId, conversationId, conversationType } = params;
  await getConversationContext(userId, conversationId, conversationType);

  const field = conversationType === 'skill' ? 'connectionId' : 'friendshipId';
  const userObjectId = assertValidObjectId(userId, 'userId');
  const filter: Record<string, unknown> = {
    [field]: new mongoose.Types.ObjectId(conversationId),
    senderId: { $ne: userObjectId },
    readAt: null,
  };
  if (params.lastReadMessageId) {
    filter._id = { $lte: assertValidObjectId(params.lastReadMessageId, 'lastReadMessageId') };
  }

  const result = await Message.updateMany(filter, { $set: { readAt: new Date() } });

  await ConversationSettings.findOneAndUpdate(
    { userId: userObjectId, conversationId },
    {
      $set: {
        lastReadMessageId: params.lastReadMessageId ? assertValidObjectId(params.lastReadMessageId, 'lastReadMessageId') : undefined,
        lastReadAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await resetUnread(userId, conversationId);
  await invalidateConversationCache(userId);

  return { updatedCount: result.modifiedCount ?? 0 };
}

export async function addReaction(params: {
  userId: string;
  messageId: string;
  emoji: ReactionEmoji;
}): Promise<{ messageId: string; reactions: ReactionDTO[]; conversationId: string; conversationType: ConversationType }> {
  if (!ALLOWED_EMOJIS.includes(params.emoji)) {
    throw new HttpError(422, 'INVALID_EMOJI', 'That reaction is not supported');
  }
  const message = await Message.findById(assertValidObjectId(params.messageId, 'messageId'));
  if (!message) throw new HttpError(404, 'MESSAGE_NOT_FOUND', 'Message not found');

  const conversationType: ConversationType = message.connectionId ? 'skill' : 'friend';
  const conversationId = String(message.connectionId ?? message.friendshipId);
  await getConversationContext(params.userId, conversationId, conversationType);

  const existingIndex = (message.reactions ?? []).findIndex(
    (r) => String(r.userId) === params.userId && r.emoji === params.emoji
  );
  let reactions = [...(message.reactions ?? [])];
  if (existingIndex >= 0) {
    reactions = reactions.filter(
      (r) => !(String(r.userId) === params.userId && r.emoji === params.emoji)
    );
  } else {
    reactions = reactions.filter((r) => String(r.userId) !== params.userId);
    reactions.push({
      _id: new Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(params.userId),
      emoji: params.emoji,
      createdAt: new Date(),
    } as any);
  }

  message.reactions = reactions as any;
  await message.save();

  return {
    messageId: String(message._id),
    reactions: reactions.map((r) => ({
      userId: String(r.userId),
      emoji: r.emoji,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    })),
    conversationId,
    conversationType,
  };
}

export async function removeReaction(params: {
  userId: string;
  messageId: string;
  emoji: ReactionEmoji;
}): Promise<{ messageId: string; reactions: ReactionDTO[]; conversationId: string; conversationType: ConversationType }> {
  const message = await Message.findById(assertValidObjectId(params.messageId, 'messageId'));
  if (!message) throw new HttpError(404, 'MESSAGE_NOT_FOUND', 'Message not found');

  const conversationType: ConversationType = message.connectionId ? 'skill' : 'friend';
  const conversationId = String(message.connectionId ?? message.friendshipId);
  await getConversationContext(params.userId, conversationId, conversationType);

  const reactions = (message.reactions ?? []).filter(
    (r) => !(String(r.userId) === params.userId && r.emoji === params.emoji)
  );
  message.reactions = reactions as any;
  await message.save();

  return {
    messageId: String(message._id),
    reactions: reactions.map((r) => ({
      userId: String(r.userId),
      emoji: r.emoji,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    })),
    conversationId,
    conversationType,
  };
}

export async function editMessage(params: {
  userId: string;
  messageId: string;
  content: string;
}): Promise<{ messageId: string; conversationId: string; conversationType: ConversationType; content: string; editedAt: Date }> {
  const message = await Message.findById(assertValidObjectId(params.messageId, 'messageId'));
  if (!message) throw new HttpError(404, 'MESSAGE_NOT_FOUND', 'Message not found');
  if (String(message.senderId) !== params.userId) {
    throw new HttpError(403, 'NOT_SENDER', 'You can only edit your own messages');
  }
  if (message.type !== 'text') {
    throw new HttpError(400, 'INVALID_TYPE', 'Only text messages can be edited');
  }
  const ageMs = Date.now() - new Date(message.createdAt).getTime();
  if (ageMs > EDIT_WINDOW_MS) {
    throw new HttpError(400, 'EDIT_WINDOW_EXPIRED', 'Messages can only be edited within 5 minutes of sending');
  }

  const content = sanitizeText(params.content ?? '');
  if (!content.trim()) throw new HttpError(400, 'EMPTY_MESSAGE', 'Message content cannot be empty');
  if (content.length > MAX_CONTENT_LENGTH) {
    throw new HttpError(422, 'CONTENT_TOO_LONG', `Message must be ${MAX_CONTENT_LENGTH} characters or fewer`);
  }

  const history = [...(message.editHistory ?? [])];
  history.push({ content: message.content ?? '', editedAt: new Date() });

  message.content = content;
  message.editHistory = history;
  message.editedAt = new Date();
  await message.save();

  const conversationType: ConversationType = message.connectionId ? 'skill' : 'friend';
  const conversationId = String(message.connectionId ?? message.friendshipId);

  return {
    messageId: String(message._id),
    conversationId,
    conversationType,
    content,
    editedAt: message.editedAt,
  };
}

export async function deleteMessage(params: {
  userId: string;
  messageId: string;
}): Promise<{ messageId: string; conversationId: string; conversationType: ConversationType; deletedAt: Date }> {
  const message = await Message.findById(assertValidObjectId(params.messageId, 'messageId'));
  if (!message) throw new HttpError(404, 'MESSAGE_NOT_FOUND', 'Message not found');
  if (String(message.senderId) !== params.userId) {
    throw new HttpError(403, 'NOT_SENDER', 'You can only delete your own messages');
  }
  const ageMs = Date.now() - new Date(message.createdAt).getTime();
  if (ageMs > DELETE_WINDOW_MS) {
    throw new HttpError(400, 'DELETE_WINDOW_EXPIRED', 'Messages can only be deleted within 5 minutes of sending');
  }

  message.deletedAt = new Date();
  message.deletedBy = new mongoose.Types.ObjectId(params.userId);
  message.content = '';
  await message.save();

  const conversationType: ConversationType = message.connectionId ? 'skill' : 'friend';
  const conversationId = String(message.connectionId ?? message.friendshipId);

  return {
    messageId: String(message._id),
    conversationId,
    conversationType,
    deletedAt: message.deletedAt,
  };
}

export async function unsendMessage(params: {
  userId: string;
  messageId: string;
}): Promise<{ messageId: string; conversationId: string; conversationType: ConversationType; unsentAt: Date }> {
  const message = await Message.findById(assertValidObjectId(params.messageId, 'messageId'));
  if (!message) throw new HttpError(404, 'MESSAGE_NOT_FOUND', 'Message not found');
  if (String(message.senderId) !== params.userId) {
    throw new HttpError(403, 'NOT_SENDER', 'You can only unsend your own messages');
  }
  const ageMs = Date.now() - new Date(message.createdAt).getTime();
  if (ageMs > DELETE_WINDOW_MS) {
    throw new HttpError(400, 'UNSEND_WINDOW_EXPIRED', 'Messages can only be unsent within 5 minutes of sending');
  }
  if (message.unsentAt || message.deletedAt) {
    throw new HttpError(400, 'MESSAGE_NOT_AVAILABLE', 'Message is no longer available to unsend');
  }

  message.unsentAt = new Date();
  message.deletedAt = new Date();
  message.deletedBy = new mongoose.Types.ObjectId(params.userId);
  message.content = '';
  message.reactions = [];
  await message.save();

  const conversationType: ConversationType = message.connectionId ? 'skill' : 'friend';
  const conversationId = String(message.connectionId ?? message.friendshipId);

  return {
    messageId: String(message._id),
    conversationId,
    conversationType,
    unsentAt: message.unsentAt,
  };
}

export async function searchConversations(params: {
  userId: string;
  query: string;
  limit?: number;
}): Promise<{ conversations: ConversationSummary[]; messages: MessengerMessageDTO[] }> {
  const { userId } = params;
  const query = params.query.trim().slice(0, 200);
  if (!query) return { conversations: [], messages: [] };
  const limit = Math.min(Number(params.limit) || 20, 50);

  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const conversations = await getConversationList(userId);
  const matchingConversations = conversations.filter((c) => {
    const nameMatch = c.participants.some((p) => p.displayName.toLowerCase().includes(query.toLowerCase()));
    const skillMatch = c.skillContext?.skillName.toLowerCase().includes(query.toLowerCase()) ?? false;
    const previewMatch = c.lastMessage?.content?.toLowerCase().includes(query.toLowerCase()) ?? false;
    return nameMatch || skillMatch || previewMatch;
  });

  const userObjectId = assertValidObjectId(userId, 'userId');
  const messageDocs = await Message.find({
    content: { $regex: regex },
    deletedAt: null,
    unsentAt: null,
    $or: [
      { connectionId: { $exists: true } },
      { friendshipId: { $exists: true } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const messages: MessengerMessageDTO[] = [];
  for (const doc of messageDocs) {
    const sender = await User.findById(doc.senderId).select('isShadowBanned').lean();
    if (sender?.isShadowBanned && String(doc.senderId) !== userId) continue;
    const conversationType: ConversationType = doc.connectionId ? 'skill' : 'friend';
    const conversationId = String(doc.connectionId ?? doc.friendshipId);
    try {
      await getConversationContext(userId, conversationId, conversationType);
      messages.push(await toMessageDTO(doc as IMessageDocument, userId, conversationId, conversationType));
    } catch {
      // skip conversations the user cannot access
    }
  }

  return { conversations: matchingConversations.slice(0, limit), messages };
}

export async function searchInConversation(params: {
  userId: string;
  conversationId: string;
  conversationType: ConversationType;
  query: string;
  limit?: number;
  cursor?: string;
}): Promise<{ messages: MessengerMessageDTO[]; nextCursor: string | null; hasMore: boolean }> {
  const { userId, conversationId, conversationType } = params;
  const query = params.query.trim().slice(0, 200);
  await getConversationContext(userId, conversationId, conversationType);
  if (!query) return { messages: [], nextCursor: null, hasMore: false };

  const limit = Math.min(Number(params.limit) || 20, 50);
  const field = conversationType === 'skill' ? 'connectionId' : 'friendshipId';
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const mongoQuery: Record<string, unknown> = {
    [field]: new mongoose.Types.ObjectId(conversationId),
    content: { $regex: regex },
    deletedAt: null,
    unsentAt: null,
  };

  if (params.cursor) {
    try {
      const decoded = Buffer.from(params.cursor, 'base64').toString('utf8');
      const [messageId, isoDate] = decoded.split('|');
      mongoQuery.createdAt = { $lt: new Date(isoDate) };
      mongoQuery._id = { $lt: new mongoose.Types.ObjectId(messageId) };
    } catch {
      throw new HttpError(400, 'INVALID_CURSOR', 'Invalid pagination cursor');
    }
  }

  const raw = await Message.find(mongoQuery).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).lean();
  const hasMore = raw.length > limit;
  const sliced = raw.slice(0, limit);

  const filtered: IMessageDocument[] = [];
  for (const msg of sliced) {
    const sender = await User.findById(msg.senderId).select('isShadowBanned').lean();
    if (sender?.isShadowBanned && String(msg.senderId) !== userId) continue;
    filtered.push(msg as IMessageDocument);
  }

  const messages = await Promise.all(
    filtered.map((msg) => toMessageDTO(msg, userId, conversationId, conversationType))
  );

  const lastMsg = sliced[sliced.length - 1];
  const nextCursor =
    hasMore && lastMsg
      ? Buffer.from(`${String(lastMsg._id)}|${new Date(lastMsg.createdAt).toISOString()}`).toString('base64')
      : null;

  return { messages: messages.reverse(), nextCursor, hasMore };
}

export async function getMediaGallery(params: {
  userId: string;
  conversationId: string;
  conversationType: ConversationType;
  cursor?: string;
  limit?: number;
}): Promise<{ images: Array<{ messageId: string; imageUrl: string; imageThumbnailUrl?: string; imageWidth?: number; imageHeight?: number; createdAt: string }>; nextCursor: string | null; hasMore: boolean }> {
  const { userId, conversationId, conversationType } = params;
  await getConversationContext(userId, conversationId, conversationType);

  const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 50);
  const field = conversationType === 'skill' ? 'connectionId' : 'friendshipId';
  const query: Record<string, unknown> = { [field]: new mongoose.Types.ObjectId(conversationId), type: 'image', deletedAt: null, unsentAt: null };

  if (params.cursor) {
    try {
      const decoded = Buffer.from(params.cursor, 'base64').toString('utf8');
      const [messageId, isoDate] = decoded.split('|');
      query.createdAt = { $lt: new Date(isoDate) };
      query._id = { $lt: new mongoose.Types.ObjectId(messageId) };
    } catch {
      throw new HttpError(400, 'INVALID_CURSOR', 'Invalid pagination cursor');
    }
  }

  const raw = await Message.find(query).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).lean();
  const hasMore = raw.length > limit;
  const sliced = raw.slice(0, limit);

  return {
    images: sliced.map((msg) => ({
      messageId: String(msg._id),
      imageUrl: msg.imageUrl ?? '',
      imageThumbnailUrl: msg.imageThumbnailUrl,
      imageWidth: msg.imageWidth,
      imageHeight: msg.imageHeight,
      createdAt: new Date(msg.createdAt).toISOString(),
    })),
    nextCursor:
      hasMore && sliced.length > 0
        ? Buffer.from(`${String(sliced[sliced.length - 1]._id)}|${new Date(sliced[sliced.length - 1].createdAt).toISOString()}`).toString('base64')
        : null,
    hasMore,
  };
}

export async function updateConversationSettings(params: {
  userId: string;
  conversationId: string;
  conversationType: ConversationType;
  patch: Partial<{
    isPinned: boolean;
    isMuted: boolean;
    mutedUntil: Date | null;
    isArchived: boolean;
    customNickname: string;
    notificationOverride: 'default' | 'all' | 'mentions_only' | 'none';
    chatTheme: 'default' | 'sunset' | 'ocean' | 'forest' | 'midnight';
  }>;
}): Promise<Record<string, any>> {
  const { userId, conversationId, conversationType, patch } = params;
  await getConversationContext(userId, conversationId, conversationType);

  const set: Record<string, any> = {};
  const unset: Record<string, any> = {};

  if (patch.isPinned !== undefined) {
    set.isPinned = patch.isPinned;
    if (patch.isPinned) set.pinnedAt = new Date();
    else unset.pinnedAt = 1;
  }
  if (patch.isMuted !== undefined) {
    set.isMuted = patch.isMuted;
    if (patch.isMuted && patch.mutedUntil) set.mutedUntil = patch.mutedUntil;
    if (!patch.isMuted) unset.mutedUntil = 1;
  }
  if (patch.isArchived !== undefined) {
    set.isArchived = patch.isArchived;
    if (patch.isArchived) set.archivedAt = new Date();
    else unset.archivedAt = 1;
  }
  if (patch.customNickname !== undefined) {
    set.customNickname = patch.customNickname.slice(0, 30);
  }
  if (patch.notificationOverride !== undefined) {
    set.notificationOverride = patch.notificationOverride;
  }
  if (patch.chatTheme !== undefined) {
    set.chatTheme = patch.chatTheme;
  }

  const update: Record<string, any> = {};
  if (Object.keys(set).length) update.$set = set;
  if (Object.keys(unset).length) update.$unset = unset;

  if (Object.keys(update).length === 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'No settings to update');
  }

  const result = await ConversationSettings.findOneAndUpdate(
    { userId: assertValidObjectId(userId, 'userId'), conversationId },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  await invalidateConversationCache(userId);
  return result;
}

export async function clearHistory(params: {
  userId: string;
  conversationId: string;
  conversationType: ConversationType;
}): Promise<{ success: boolean }> {
  const { userId, conversationId, conversationType } = params;
  await getConversationContext(userId, conversationId, conversationType);

  const field = conversationType === 'skill' ? 'connectionId' : 'friendshipId';
  await Message.updateMany(
    {
      [field]: new mongoose.Types.ObjectId(conversationId),
      senderId: assertValidObjectId(userId, 'userId'),
      deletedAt: null,
    },
    { $set: { deletedAt: new Date(), deletedBy: assertValidObjectId(userId, 'userId'), content: '' } }
  );

  await invalidateConversationCache(userId);
  return { success: true };
}

export async function deleteConversation(params: {
  userId: string;
  conversationId: string;
  conversationType: ConversationType;
}): Promise<{ success: boolean; participantIds: string[] }> {
  const { userId, conversationId, conversationType } = params;
  const context = await getConversationContext(userId, conversationId, conversationType);

  const field = conversationType === 'skill' ? 'connectionId' : 'friendshipId';
  await Message.deleteMany({ [field]: new mongoose.Types.ObjectId(conversationId) });

  const userObjectId = assertValidObjectId(userId, 'userId');
  await ConversationSettings.findOneAndUpdate(
    { userId: userObjectId, conversationId, conversationType },
    {
      $set: { deletedAt: new Date(), isPinned: false, isArchived: false },
      $unset: { pinnedAt: 1, archivedAt: 1 },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );

  for (const participantId of context.participantIds) {
    await resetUnread(participantId, conversationId);
    await invalidateConversationCache(participantId);
  }

  return { success: true, participantIds: context.participantIds };
}

export async function reviveConversation(params: {
  userId: string;
  conversationId: string;
  conversationType: ConversationType;
}): Promise<void> {
  await ConversationSettings.findOneAndUpdate(
    { userId: assertValidObjectId(params.userId, 'userId'), conversationId: params.conversationId, conversationType: params.conversationType },
    { $unset: { deletedAt: 1 } }
  );
  await invalidateConversationCache(params.userId);
}
