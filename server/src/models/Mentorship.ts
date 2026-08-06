import mongoose, { Document, Schema, Types } from 'mongoose';

export type MentorshipStatus = 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface IGoal {
  title: string;
  description: string;
  targetDate?: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface ICheckIn {
  date: Date;
  notes: string;
  mentorNotes?: string;
}

export interface IMentorship extends Document {
  mentorId: Types.ObjectId;
  menteeId: Types.ObjectId;
  skillId: Types.ObjectId;
  status: MentorshipStatus;
  goals: IGoal[];
  checkIns: ICheckIn[];
  startDate: Date;
  targetEndDate?: Date;
  completedAt?: Date;
  durationMonths: number;
  meetingFrequency: 'weekly' | 'biweekly' | 'monthly';
  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new Schema<IGoal>(
  {
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 500, default: '' },
    targetDate: { type: Date },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: false }
);

const checkInSchema = new Schema<ICheckIn>(
  {
    date: { type: Date, default: Date.now },
    notes: { type: String, required: true, maxlength: 500 },
    mentorNotes: { type: String, maxlength: 500 },
  },
  { _id: false }
);

const mentorshipSchema = new Schema<IMentorship>(
  {
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    menteeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'paused', 'completed', 'cancelled'],
      default: 'pending',
    },
    goals: {
      type: [goalSchema],
      default: [],
    },
    checkIns: {
      type: [checkInSchema],
      default: [],
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    targetEndDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    durationMonths: {
      type: Number,
      default: 3,
      min: 1,
      max: 12,
    },
    meetingFrequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'biweekly',
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

mentorshipSchema.index({ mentorId: 1, status: 1 });
mentorshipSchema.index({ menteeId: 1, status: 1 });
mentorshipSchema.index({ status: 1, createdAt: -1 });

const Mentorship = mongoose.model<IMentorship>('Mentorship', mentorshipSchema);
export default Mentorship;
