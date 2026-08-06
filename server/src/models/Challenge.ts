import mongoose, { Document, Schema, Types } from 'mongoose';

export type ChallengeStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export interface IChallengeParticipant {
  userId: Types.ObjectId;
  joinedAt: Date;
  progress: number;
  completedAt?: Date;
}

export interface IChallenge extends Document {
  creatorId: Types.ObjectId;
  title: string;
  description: string;
  skillCategory: string;
  challengeType: 'teach' | 'learn' | 'both';
  goalDescription: string;
  goalTarget: number;
  startDate: Date;
  endDate: Date;
  status: ChallengeStatus;
  participants: IChallengeParticipant[];
  badgeName: string;
  badgeIcon: string;
  maxParticipants?: number;
  createdAt: Date;
  updatedAt: Date;
}

const challengeParticipantSchema = new Schema<IChallengeParticipant>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0 },
    completedAt: { type: Date },
  },
  { _id: false }
);

const challengeSchema = new Schema<IChallenge>(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    skillCategory: {
      type: String,
      required: true,
    },
    challengeType: {
      type: String,
      enum: ['teach', 'learn', 'both'],
      default: 'both',
    },
    goalDescription: {
      type: String,
      required: true,
      maxlength: 200,
    },
    goalTarget: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    participants: {
      type: [challengeParticipantSchema],
      default: [],
    },
    badgeName: {
      type: String,
      required: true,
      maxlength: 50,
    },
    badgeIcon: {
      type: String,
      default: '🏆',
    },
    maxParticipants: {
      type: Number,
      min: 2,
      max: 500,
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

challengeSchema.index({ status: 1, startDate: -1 });
challengeSchema.index({ skillCategory: 1, status: 1 });
challengeSchema.index({ creatorId: 1 });

const Challenge = mongoose.model<IChallenge>('Challenge', challengeSchema);
export default Challenge;
