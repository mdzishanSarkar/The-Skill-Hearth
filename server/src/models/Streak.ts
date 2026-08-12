import mongoose, { Document, Schema, Types } from 'mongoose';

export type StreakType = 'teaching' | 'learning' | 'logging';

export interface IStreak extends Document {
  userId: Types.ObjectId;
  type: StreakType;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: Date;
  streakStartDate?: Date;
  freezesUsed: number;
  freezesAvailable: number;
  frozenUntil?: Date;
  milestones: number[];
  createdAt: Date;
  updatedAt: Date;
}

const streakSchema = new Schema<IStreak>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['teaching', 'learning', 'logging'],
      required: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastActivityDate: {
      type: Date,
    },
    streakStartDate: {
      type: Date,
    },
    freezesUsed: {
      type: Number,
      default: 0,
    },
    freezesAvailable: {
      type: Number,
      default: 1,
    },
    frozenUntil: {
      type: Date,
    },
    milestones: {
      type: [Number],
      default: [],
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

streakSchema.index({ userId: 1, type: 1 }, { unique: true });

const Streak = mongoose.model<IStreak>('Streak', streakSchema);
export default Streak;
