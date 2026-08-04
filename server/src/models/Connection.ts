import mongoose, { Document, Schema, Types } from 'mongoose';

export type ConnectionStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'completed'
  | 'withdrawn'
  | 'cancelled';

export interface IConnection extends Document {
  requesterId: Types.ObjectId;
  teacherId: Types.ObjectId;
  skillId: Types.ObjectId;
  status: ConnectionStatus;
  message: string;
  responseMessage?: string;
  proposedFormat: 'in-person' | 'online' | 'either';
  completedAt?: Date;
  cancelledBy?: Types.ObjectId;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const connectionSchema = new Schema<IConnection>(
  {
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
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
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'withdrawn', 'cancelled'],
      default: 'pending',
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    responseMessage: {
      type: String,
      maxlength: 500,
    },
    proposedFormat: {
      type: String,
      enum: ['in-person', 'online', 'either'],
      required: true,
    },
    completedAt: {
      type: Date,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    cancellationReason: {
      type: String,
      maxlength: 300,
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

connectionSchema.index({ requesterId: 1, status: 1 });
connectionSchema.index({ teacherId: 1, status: 1 });
connectionSchema.index({ skillId: 1, status: 1 });
connectionSchema.index({ requesterId: 1, teacherId: 1, skillId: 1, status: 1 });
connectionSchema.index({ status: 1, createdAt: -1 });

const Connection = mongoose.model<IConnection>('Connection', connectionSchema);
export default Connection;
