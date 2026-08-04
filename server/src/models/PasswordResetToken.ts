import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPasswordResetToken extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
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

passwordResetTokenSchema.index({ userId: 1, isUsed: 1 });
passwordResetTokenSchema.index({ tokenHash: 1 });
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetToken = mongoose.model<IPasswordResetToken>('PasswordResetToken', passwordResetTokenSchema);
export default PasswordResetToken;
