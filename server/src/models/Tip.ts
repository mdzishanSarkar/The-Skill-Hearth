import mongoose, { Document, Schema, Types } from 'mongoose';

export type TipStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface ITip extends Document {
  payerId: Types.ObjectId;
  payeeId: Types.ObjectId;
  connectionId: Types.ObjectId;
  amount: number;
  currency: string;
  stripePaymentIntentId?: string;
  status: TipStatus;
  platformFee: number;
  createdAt: Date;
  updatedAt: Date;
}

const tipSchema = new Schema<ITip>(
  {
    payerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    payeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    connectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Connection',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 100,
      max: 2000,
    },
    currency: {
      type: String,
      default: 'usd',
      lowercase: true,
    },
    stripePaymentIntentId: {
      type: String,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    platformFee: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        delete ret.stripePaymentIntentId;
        return ret;
      },
    },
  }
);

tipSchema.index({ payerId: 1, createdAt: -1 });
tipSchema.index({ payeeId: 1, createdAt: -1 });
tipSchema.index({ connectionId: 1 });
tipSchema.index({ stripePaymentIntentId: 1 }, { sparse: true });

const Tip = mongoose.model<ITip>('Tip', tipSchema);
export default Tip;
