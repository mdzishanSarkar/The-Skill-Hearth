import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEmailVerificationToken extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

const emailVerificationTokenSchema = new Schema<IEmailVerificationToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.tokenHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

emailVerificationTokenSchema.index({ userId: 1, isUsed: 1 });
emailVerificationTokenSchema.index({ tokenHash: 1 });
emailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailVerificationToken = mongoose.model<IEmailVerificationToken>(
  'EmailVerificationToken',
  emailVerificationTokenSchema
);
export default EmailVerificationToken;
