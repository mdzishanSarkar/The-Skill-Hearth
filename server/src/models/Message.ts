import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReaction {
  userId: Types.ObjectId;
  emoji: string;
  createdAt: Date;
}

export interface IMessage extends Document {
  connectionId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'system';
  imageUrl?: string;
  imagePublicId?: string;
  readAt?: Date;
  deliveredAt?: Date;
  isReported: boolean;
  reactions: IReaction[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reactionSchema = new Schema<IReaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const messageSchema = new Schema<IMessage>(
  {
    connectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Connection',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'system'],
      default: 'text',
    },
    imageUrl: {
      type: String,
    },
    imagePublicId: {
      type: String,
    },
    readAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    reactions: {
      type: [reactionSchema],
      default: [],
      validate: {
        validator: (v: IReaction[]) => v.length <= 20,
        message: 'Maximum 20 reactions per message',
      },
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
          ret.imageUrl = null;
        }
        delete ret.isDeleted;
        delete ret.__v;
        return ret;
      },
    },
  }
);

messageSchema.index({ connectionId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ connectionId: 1, readAt: 1 });
messageSchema.index({ isReported: 1 });

const Message = mongoose.model<IMessage>('Message', messageSchema);
export default Message;
