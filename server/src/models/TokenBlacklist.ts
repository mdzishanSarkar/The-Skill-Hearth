import mongoose, { Document, Schema } from 'mongoose';

export interface ITokenBlacklist extends Document {
  tokenId: string;
  type: 'access' | 'refresh';
  expiresAt: Date;
  createdAt: Date;
}

const tokenBlacklistSchema = new Schema<ITokenBlacklist>(
  {
    tokenId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['access', 'refresh'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TokenBlacklist = mongoose.model<ITokenBlacklist>('TokenBlacklist', tokenBlacklistSchema);
export default TokenBlacklist;
