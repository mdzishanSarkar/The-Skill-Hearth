import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISkillJournal extends Document {
  userId: Types.ObjectId;
  connectionId: Types.ObjectId;
  prompt: string;
  content: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  isHighlighted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const skillJournalSchema = new Schema<ISkillJournal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    connectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Connection',
      required: true,
    },
    prompt: {
      type: String,
      required: true,
      maxlength: 300,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    mood: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
    },
    isHighlighted: {
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

skillJournalSchema.index({ userId: 1, createdAt: -1 });
skillJournalSchema.index({ connectionId: 1, userId: 1 });

const SkillJournal = mongoose.model<ISkillJournal>('SkillJournal', skillJournalSchema);
export default SkillJournal;
