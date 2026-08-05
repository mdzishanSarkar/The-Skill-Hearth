import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISessionNote extends Document {
  connectionId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionNoteSchema = new Schema<ISessionNote>(
  {
    connectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Connection',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      default: '',
      maxlength: 2000,
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

sessionNoteSchema.index({ connectionId: 1, userId: 1 }, { unique: true });

const SessionNote = mongoose.model<ISessionNote>('SessionNote', sessionNoteSchema);
export default SessionNote;
