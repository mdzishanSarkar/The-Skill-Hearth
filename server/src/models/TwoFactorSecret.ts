import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITwoFactorSecret extends Document {
  userId: Types.ObjectId;
  secret: string;
  enabled: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const twoFactorSecretSchema = new Schema<ITwoFactorSecret>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    secret: {
      type: String,
      required: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        delete ret.secret;
        return ret;
      },
    },
  }
);

twoFactorSecretSchema.index({ userId: 1 });

const TwoFactorSecret = mongoose.model<ITwoFactorSecret>('TwoFactorSecret', twoFactorSecretSchema);
export default TwoFactorSecret;
