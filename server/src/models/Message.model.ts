import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { sanitizeText } from '../utils/sanitize';

export type MessageType = 'text' | 'system' | 'image' | 'skill_card' | 'voice_note' | 'gif';
export type ReactionEmoji = '👍' | '❤️' | '😂' | '😮' | '😢' | '🙏' | '🔥';
export type SystemMessageEvent =
  | 'connection_accepted'
  | 'connection_completed'
  | 'safe_meeting_reminder'
  | 'review_prompt'
  | 'friend_accepted'
  | 'skill_swap_matched'
  | 'session_scheduled';

export interface IInboxReaction {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  emoji: ReactionEmoji;
  createdAt: Date;
}

export interface IReplyToPreview {
  senderId: Types.ObjectId;
  senderName: string;
  contentPreview: string;
}

export interface ISkillCardData {
  skillId: Types.ObjectId;
  skillName: string;
  teacherName: string;
  teacherAvatarUrl: string;
  requestStatus: 'pending' | 'accepted' | 'rejected';
}

export interface IMessageDocument extends Document {
  _id: Types.ObjectId;
  connectionId?: Types.ObjectId;
  friendshipId?: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  type: MessageType;
  imageUrl?: string;
  imageThumbnailUrl?: string;
  imagePublicId?: string;
  imageWidth?: number;
  imageHeight?: number;
  readAt?: Date;
  deliveredAt?: Date;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  unsentAt?: Date;
  reactions: IInboxReaction[];
  isReported: boolean;
  reportCount: number;

  editedAt?: Date;
  editHistory?: Array<{ content: string; editedAt: Date }>;

  skillCardData?: ISkillCardData;
  voiceNoteUrl?: string;
  voiceNoteDurationSeconds?: number;
  voiceNoteWaveform?: number[];
  gifUrl?: string;
  gifWidth?: number;
  gifHeight?: number;

  replyToMessageId?: Types.ObjectId;
  replyToPreview?: IReplyToPreview;

  systemEvent?: SystemMessageEvent;

  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface IMessageModel extends Model<IMessageDocument> {
  getHistory(connectionId: string, limit?: number, beforeCursor?: string): Promise<{ messages: IMessageDocument[]; nextCursor?: string; hasMore: boolean }>;
  getUnreadCount(connectionId: string, userId: string): Promise<number>;
  markConnectionRead(connectionId: string, userId: string): Promise<{ updatedCount: number }>;
}

const reactionSchema = new Schema<IInboxReaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, enum: ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥'], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const editHistoryEntrySchema = new Schema(
  {
    content: { type: String, required: true },
    editedAt: { type: Date, required: true },
  },
  { _id: false }
);

const skillCardDataSchema = new Schema<ISkillCardData>(
  {
    skillId: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
    skillName: { type: String, required: true, maxlength: 100 },
    teacherName: { type: String, required: true, maxlength: 50 },
    teacherAvatarUrl: { type: String, default: '' },
    requestStatus: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  { _id: false }
);

const replyToPreviewSchema = new Schema<IReplyToPreview>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true, maxlength: 50 },
    contentPreview: { type: String, required: true, maxlength: 80 },
  },
  { _id: false }
);

const messageSchema = new Schema<IMessageDocument>(
  {
    connectionId: { type: Schema.Types.ObjectId, ref: 'Connection', index: true },
    friendshipId: { type: Schema.Types.ObjectId, ref: 'Friendship', index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, default: '', trim: true, maxlength: 2000 },
    type: { type: String, enum: ['text', 'system', 'image', 'skill_card', 'voice_note', 'gif'], default: 'text' },
    imageUrl: { type: String },
    imageThumbnailUrl: { type: String },
    imagePublicId: { type: String },
    imageWidth: { type: Number },
    imageHeight: { type: Number },
    readAt: { type: Date },
    deliveredAt: { type: Date },
    deletedAt: { type: Date, sparse: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    unsentAt: { type: Date, sparse: true },
    reactions: { type: [reactionSchema], default: [] },
    isReported: { type: Boolean, default: false },
    reportCount: { type: Number, default: 0 },

    editedAt: { type: Date },
    editHistory: { type: [editHistoryEntrySchema], default: [] },

    skillCardData: { type: skillCardDataSchema },
    voiceNoteUrl: { type: String },
    voiceNoteDurationSeconds: { type: Number },
    voiceNoteWaveform: { type: [Number], default: [] },
    gifUrl: { type: String },
    gifWidth: { type: Number },
    gifHeight: { type: Number },

    replyToMessageId: { type: Schema.Types.ObjectId, ref: 'Message' },
    replyToPreview: { type: replyToPreviewSchema },

    systemEvent: { type: String, enum: ['connection_accepted', 'connection_completed', 'safe_meeting_reminder', 'review_prompt', 'friend_accepted', 'skill_swap_matched', 'session_scheduled'] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

messageSchema.virtual('isDeleted').get(function (this: IMessageDocument) {
  return Boolean(this.deletedAt);
});

messageSchema.index({ connectionId: 1, createdAt: -1 });
messageSchema.index({ connectionId: 1, readAt: 1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ friendshipId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, type: 1, createdAt: -1 });
messageSchema.index({ reportCount: 1 });

messageSchema.pre('save', async function () {
  if (this.type === 'text' && !this.content?.trim()) {
    throw new Error('Message content cannot be empty.');
  }

  if (this.type === 'image' && !this.imageUrl) {
    throw new Error('Image messages require an imageUrl.');
  }

  if (this.type !== 'system') {
    this.content = sanitizeText(this.content ?? '');
  }
});

messageSchema.statics.getHistory = async function (
  connectionId: string,
  limit = 50,
  beforeCursor?: string,
) {
  if (!mongoose.Types.ObjectId.isValid(connectionId)) {
    throw new Error('INVALID_CONNECTION_ID');
  }

  const query: Record<string, unknown> = { connectionId: new mongoose.Types.ObjectId(connectionId) };

  if (beforeCursor) {
    try {
      const decoded = Buffer.from(beforeCursor, 'base64').toString('utf8');
      const [messageId, isoDate] = decoded.split('|');
      if (!messageId || !isoDate) throw new Error('INVALID_CURSOR');
      query.createdAt = { $lt: new Date(isoDate) };
      query._id = { $lt: new mongoose.Types.ObjectId(messageId) };
    } catch {
      throw new Error('INVALID_CURSOR');
    }
  }

  const rawMessages = await this.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(Math.min(Number(limit) || 50, 200))
    .lean();

  const messages = rawMessages.map((message: any) => {
    if (message.deletedAt) {
      return {
        ...message,
        content: null,
        isDeleted: true,
      };
    }
    return { ...message, isDeleted: false };
  });

  const hasMore = rawMessages.length === Math.min(Number(limit) || 50, 200);
  const nextCursor = messages.length > 0
    ? Buffer.from(`${messages[messages.length - 1]._id}|${messages[messages.length - 1].createdAt.toISOString()}`).toString('base64')
    : undefined;

  return { messages: messages.reverse(), nextCursor, hasMore };
};

messageSchema.statics.getUnreadCount = async function (connectionId: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(connectionId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return 0;
  }

  return Number(
    await this.countDocuments({
      connectionId: new mongoose.Types.ObjectId(connectionId),
      senderId: { $ne: new mongoose.Types.ObjectId(userId) },
      readAt: null,
    })
  );
};

messageSchema.statics.markConnectionRead = async function (connectionId: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(connectionId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return { updatedCount: 0 };
  }

  const result = await this.updateMany(
    {
      connectionId: new mongoose.Types.ObjectId(connectionId),
      senderId: { $ne: new mongoose.Types.ObjectId(userId) },
      readAt: null,
    },
    { $set: { readAt: new Date() } }
  );

  return { updatedCount: result.modifiedCount ?? 0 };
};

const MessageModel = mongoose.model<IMessageDocument, IMessageModel>('Message', messageSchema);
export default MessageModel;
