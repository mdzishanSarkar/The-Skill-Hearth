import mongoose, { Document, Schema, Types } from 'mongoose';

export type OAuthProviderName = 'google' | 'apple';

export interface IOAuthProvider extends Document {
  userId: Types.ObjectId;
  provider: OAuthProviderName;
  providerUserId: string;
  email: string;
  displayName: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}

const oAuthProviderSchema = new Schema<IOAuthProvider>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: String,
      enum: ['google', 'apple'],
      required: true,
    },
    providerUserId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: '',
    },
    displayName: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
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

oAuthProviderSchema.index({ provider: 1, providerUserId: 1 }, { unique: true });
oAuthProviderSchema.index({ userId: 1, provider: 1 }, { unique: true });

const OAuthProvider = mongoose.model<IOAuthProvider>('OAuthProvider', oAuthProviderSchema);
export default OAuthProvider;
