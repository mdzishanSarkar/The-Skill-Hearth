import mongoose, { Document, Schema, Types } from 'mongoose';

export type LearnerRequestStatus = 'open' | 'filled' | 'expired' | 'deleted';

export interface ILearnerRequest extends Document {
  authorId: Types.ObjectId;
  skillName: string;
  categoryName: string;
  description: string;
  city: string;
  neighborhood?: string;
  format: 'in-person' | 'online' | 'either';
  availability: string[];
  status: LearnerRequestStatus;
  responsesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const learnerRequestSchema = new Schema<ILearnerRequest>(
  {
    authorId: {
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
      maxlength: 1000,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    neighborhood: {
      type: String,
      trim: true,
      lowercase: true,
    },
    format: {
      type: String,
      enum: ['in-person', 'online', 'either'],
      default: 'either',
    },
    availability: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['open', 'filled', 'expired', 'deleted'],
      default: 'open',
    },
    responsesCount: {
      type: Number,
      default: 0,
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

learnerRequestSchema.index({ city: 1, status: 1, createdAt: -1 });
learnerRequestSchema.index({ authorId: 1, status: 1 });
learnerRequestSchema.index({ status: 1, createdAt: -1 });

const LearnerRequest = mongoose.model<ILearnerRequest>('LearnerRequest', learnerRequestSchema);
export default LearnerRequest;
