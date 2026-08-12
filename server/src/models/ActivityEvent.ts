import mongoose, { Document, Schema, Types } from 'mongoose';

export type ActivityEventType =
  | 'skill_added'
  | 'skill_completed'
  | 'session_completed'
  | 'session_taught'
  | 'session_learned'
  | 'badge_earned'
  | 'streak_milestone'
  | 'skill_swap_accepted'
  | 'joined_group_session'
  | 'review_received'
  | 'friend_joined'
  | 'friend_request_accepted'
  | 'level_up'
  | 'journal_highlight'
  | 'challenge_completed';

export type ActivityVisibility = 'public' | 'friends' | 'close_friends' | 'private';
export type ActivitySubjectType =
  | 'skill'
  | 'review'
  | 'badge'
  | 'streak'
  | 'journal_highlight'
  | 'connection'
  | 'group_session'
  | 'friendship'
  | 'swap'
  | 'challenge';

export interface IActivityReaction {
  userId: Types.ObjectId;
  emoji: string;
  createdAt: Date;
}

export interface IActivityPreview {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  emoji?: string;
}

export interface IActivityEvent extends Document {
  actorId: Types.ObjectId;
  eventType: ActivityEventType;
  subjectType: ActivitySubjectType;
  subjectId?: Types.ObjectId;
  preview: IActivityPreview;
  visibility: ActivityVisibility;
  reactions: IActivityReaction[];
  commentCount: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const activityReactionSchema = new Schema<IActivityReaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const activityPreviewSchema = new Schema<IActivityPreview>(
  {
    title: { type: String, required: true, maxlength: 200 },
    subtitle: { type: String, maxlength: 200 },
    imageUrl: { type: String },
    emoji: { type: String },
  },
  { _id: false }
);

const activityEventSchema = new Schema<IActivityEvent>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventType: {
      type: String,
      enum: [
        'skill_added',
        'skill_completed',
        'session_completed',
        'session_taught',
        'session_learned',
        'badge_earned',
        'streak_milestone',
        'skill_swap_accepted',
        'joined_group_session',
        'review_received',
        'friend_joined',
        'friend_request_accepted',
        'level_up',
        'journal_highlight',
        'challenge_completed',
      ],
      required: true,
    },
    subjectType: {
      type: String,
      enum: [
        'skill',
        'review',
        'badge',
        'streak',
        'journal_highlight',
        'connection',
        'group_session',
        'friendship',
        'swap',
        'challenge',
      ],
      required: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
    },
    preview: {
      type: activityPreviewSchema,
      required: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'friends', 'close_friends', 'private'],
      default: 'friends',
    },
    reactions: {
      type: [activityReactionSchema],
      default: [],
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
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

activityEventSchema.index({ actorId: 1, createdAt: -1 });
activityEventSchema.index({ visibility: 1, createdAt: -1 });
activityEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const ActivityEvent = mongoose.model<IActivityEvent>('ActivityEvent', activityEventSchema);
export default ActivityEvent;
