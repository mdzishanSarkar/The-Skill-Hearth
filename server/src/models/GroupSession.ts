import mongoose, { Document, Schema, Types } from 'mongoose';

export type GroupSessionStatus = 'open' | 'full' | 'completed' | 'cancelled';
export type GroupSessionType = 'regular' | 'workshop';

export interface IGroupSession extends Document {
  teacherId: Types.ObjectId;
  skillId: Types.ObjectId;
  title: string;
  description: string;
  maxParticipants: number;
  participants: Types.ObjectId[];
  format: 'in-person' | 'online' | 'either';
  location?: string;
  scheduledAt?: Date;
  status: GroupSessionStatus;
  sessionType: GroupSessionType;
  chatRoomId: string;
  cancelledReason?: string;
  isFlagged: boolean;
  flagReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const groupSessionSchema = new Schema<IGroupSession>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 2,
      max: 20,
      default: 5,
    },
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    format: {
      type: String,
      enum: ['in-person', 'online', 'either'],
      required: true,
    },
    location: {
      type: String,
      maxlength: 200,
    },
    scheduledAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['open', 'full', 'completed', 'cancelled'],
      default: 'open',
    },
    sessionType: {
      type: String,
      enum: ['regular', 'workshop'],
      default: 'regular',
    },
    chatRoomId: {
      type: String,
      required: true,
      unique: true,
    },
    cancelledReason: {
      type: String,
      maxlength: 300,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      maxlength: 500,
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

groupSessionSchema.virtual('availableSpots').get(function () {
  return this.maxParticipants - this.participants.length;
});

groupSessionSchema.index({ teacherId: 1, status: 1 });
groupSessionSchema.index({ status: 1, scheduledAt: 1 });
groupSessionSchema.index({ skillId: 1, status: 1 });
groupSessionSchema.index({ 'participants': 1 });

const GroupSession = mongoose.model<IGroupSession>('GroupSession', groupSessionSchema);
export default GroupSession;
