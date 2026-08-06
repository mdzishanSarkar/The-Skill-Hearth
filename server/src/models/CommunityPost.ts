import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUserVote {
  userId: Types.ObjectId;
  vote: 'up' | 'down';
}

export interface ICommunityPost extends Document {
  authorId: Types.ObjectId;
  content: string;
  city: string;
  neighborhood?: string;
  voteScore: number;
  userVotes: IUserVote[];
  isDeleted: boolean;
  isFlagged: boolean;
  flagReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userVoteSchema = new Schema<IUserVote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vote: { type: String, enum: ['up', 'down'], required: true },
  },
  { _id: false }
);

const communityPostSchema = new Schema<ICommunityPost>(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
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
    voteScore: {
      type: Number,
      default: 0,
    },
    userVotes: {
      type: [userVoteSchema],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
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
        delete ret.isDeleted;
        delete ret.__v;
        return ret;
      },
    },
  }
);

communityPostSchema.index({ city: 1, neighborhood: 1, createdAt: -1 });
communityPostSchema.index({ city: 1, voteScore: -1 });
communityPostSchema.index({ isDeleted: 1, createdAt: -1 });

const CommunityPost = mongoose.model<ICommunityPost>('CommunityPost', communityPostSchema);
export default CommunityPost;
