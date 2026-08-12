import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDirectMessage extends Document {
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  content: string;
  readAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const directMessageSchema = new Schema<IDirectMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    readAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        if (ret.isDeleted) {
          ret.content = null;
        }
        delete ret.isDeleted;
        delete ret.__v;
        return ret;
      },
    },
  }
);

directMessageSchema.index({ senderId: 1, createdAt: -1 });
directMessageSchema.index({ recipientId: 1, createdAt: -1 });
directMessageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
directMessageSchema.index({ recipientId: 1, readAt: 1 });

const DirectMessage = mongoose.model<IDirectMessage>('DirectMessage', directMessageSchema);
export default DirectMessage;
