import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export type ConversationType = 'skill' | 'friend' | 'group';
export type ConversationNotificationOverride = 'default' | 'all' | 'mentions_only' | 'none';
export type ConversationTheme = 'default' | 'sunset' | 'ocean' | 'forest' | 'midnight';

export interface IConversationSettings extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  conversationId: string;
  conversationType: ConversationType;

  isPinned: boolean;
  pinnedAt?: Date;

  isMuted: boolean;
  mutedUntil?: Date;

  isArchived: boolean;
  archivedAt?: Date;

  deletedAt?: Date;

  customNickname?: string;

  notificationOverride: ConversationNotificationOverride;

  lastReadMessageId?: Types.ObjectId;
  lastReadAt?: Date;

  chatTheme: ConversationTheme;

  createdAt: Date;
  updatedAt: Date;
}

export interface IConversationSettingsModel extends Model<IConversationSettings> {}

const conversationSettingsSchema = new Schema<IConversationSettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    conversationId: { type: String, required: true },
    conversationType: { type: String, enum: ['skill', 'friend', 'group'], default: 'skill' },

    isPinned: { type: Boolean, default: false },
    pinnedAt: { type: Date },

    isMuted: { type: Boolean, default: false },
    mutedUntil: { type: Date },

    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },

    deletedAt: { type: Date, sparse: true },

    customNickname: { type: String, maxlength: 30 },

    notificationOverride: { type: String, enum: ['default', 'all', 'mentions_only', 'none'], default: 'default' },

    lastReadMessageId: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastReadAt: { type: Date },

    chatTheme: { type: String, enum: ['default', 'sunset', 'ocean', 'forest', 'midnight'], default: 'default' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

conversationSettingsSchema.index({ userId: 1, conversationId: 1 }, { unique: true });
conversationSettingsSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });
conversationSettingsSchema.index({ userId: 1, isArchived: 1, updatedAt: -1 });

const ConversationSettings = mongoose.model<IConversationSettings>('ConversationSettings', conversationSettingsSchema);
export default ConversationSettings;
