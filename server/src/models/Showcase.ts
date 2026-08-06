import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IShowcaseMedia {
  url: string;
  publicId: string;
  caption?: string;
}

export interface IShowcaseLike {
  userId: Types.ObjectId;
  createdAt: Date;
}

export interface IShowcase extends Document {
  userId: Types.ObjectId;
  skillId?: Types.ObjectId;
  title: string;
  description: string;
  media: IShowcaseMedia[];
  likes: IShowcaseLike[];
  likeCount: number;
  commentCount: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const showcaseMediaSchema = new Schema<IShowcaseMedia>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String, maxlength: 200 },
  },
  { _id: false }
);

const showcaseLikeSchema = new Schema<IShowcaseLike>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const showcaseSchema = new Schema<IShowcase>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    media: {
      type: [showcaseMediaSchema],
      default: [],
      validate: {
        validator: (v: IShowcaseMedia[]) => v.length <= 5,
        message: 'Maximum 5 media items per showcase',
      },
    },
    likes: {
      type: [showcaseLikeSchema],
      default: [],
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
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
        delete ret.__v;
        return ret;
      },
    },
  }
);

showcaseSchema.index({ userId: 1, createdAt: -1 });
showcaseSchema.index({ isDeleted: 1, createdAt: -1 });
showcaseSchema.index({ likeCount: -1, createdAt: -1 });

const Showcase = mongoose.model<IShowcase>('Showcase', showcaseSchema);
export default Showcase;
