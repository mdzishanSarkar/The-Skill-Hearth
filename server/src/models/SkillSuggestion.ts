import mongoose, { Document, Schema, Types } from 'mongoose';

export type SkillSuggestionStatus = 'pending' | 'approved' | 'rejected';

export interface ISkillSuggestion extends Document {
  userId: Types.ObjectId;
  skillName: string;
  categoryName: string;
  description: string;
  status: SkillSuggestionStatus;
  adminNotes: string;
  votes: number;
  votedBy: Types.ObjectId[];
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const skillSuggestionSchema = new Schema<ISkillSuggestion>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skillName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    votes: {
      type: Number,
      default: 0,
    },
    votedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        delete ret.votedBy;
        return ret;
      },
    },
  }
);

skillSuggestionSchema.index({ status: 1, votes: -1 });
skillSuggestionSchema.index({ userId: 1 });

const SkillSuggestion = mongoose.model<ISkillSuggestion>('SkillSuggestion', skillSuggestionSchema);
export default SkillSuggestion;
