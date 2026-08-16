import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'request_received'
  | 'request_accepted'
  | 'request_rejected'
  | 'new_message'
  | 'review_prompt'
  | 'system_warning'
  | 'account_suspended'
  | 'account_banned'
  | 'skill_removed'
  | 'review_received'
  | 'group_session_joined'
  | 'group_session_left'
  | 'group_session_completed'
  | 'group_session_cancelled'
  | 'friend_request'
  | 'friend_request_accepted'
  | 'friend_joined'
  | 'saved_search_match'
  | 'radar_match'
  | 'weekly_digest';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  referenceId?: Types.ObjectId;
  referenceModel?: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'request_received',
        'request_accepted',
        'request_rejected',
        'new_message',
        'review_prompt',
        'system_warning',
        'account_suspended',
        'account_banned',
        'skill_removed',
        'review_received',
        'group_session_joined',
        'group_session_left',
        'group_session_completed',
        'group_session_cancelled',
        'friend_request',
        'friend_request_accepted',
        'friend_joined',
        'saved_search_match',
        'radar_match',
        'weekly_digest',
      ],
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
    },
    referenceModel: {
      type: String,
      enum: ['Connection', 'Message', 'Review', 'Skill', 'Report', 'GroupSession', 'Friendship', 'ActivityEvent', 'SavedSearch', 'SkillRadar'],
    },
    message: {
      type: String,
      required: true,
      maxlength: 300,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
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

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
