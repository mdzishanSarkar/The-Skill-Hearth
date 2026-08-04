import mongoose, { Document, Schema, Types } from 'mongoose';

export type ReviewTag =
  | 'Patient teacher'
  | 'Well-prepared'
  | 'Great listener'
  | 'Practical tips'
  | 'Enthusiastic'
  | 'Clear explanations'
  | 'Flexible'
  | 'Knowledgeable'
  | 'Punctual'
  | 'Engaging';

export interface IReview extends Document {
  connectionId: Types.ObjectId;
  reviewerId: Types.ObjectId;
  revieweeId: Types.ObjectId;
  skillId: Types.ObjectId;
  rating: 1 | 2 | 3 | 4 | 5;
  content: string;
  tags: ReviewTag[];
  wouldRecommend: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    connectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Connection',
      required: true,
      unique: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    revieweeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4, 5],
    },
    content: {
      type: String,
      maxlength: 500,
    },
    tags: {
      type: [String],
      default: [],
      enum: [
        'Patient teacher',
        'Well-prepared',
        'Great listener',
        'Practical tips',
        'Enthusiastic',
        'Clear explanations',
        'Flexible',
        'Knowledgeable',
        'Punctual',
        'Engaging',
      ],
    },
    wouldRecommend: {
      type: Boolean,
      default: true,
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

reviewSchema.index({ revieweeId: 1, createdAt: -1 });
reviewSchema.index({ reviewerId: 1 });
reviewSchema.index({ skillId: 1, createdAt: -1 });
reviewSchema.index({ revieweeId: 1, rating: -1 });

const Review = mongoose.model<IReview>('Review', reviewSchema);
export default Review;
