import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBlockOutDate extends Document {
  userId: Types.ObjectId;
  date: Date;
  reason: string;
  createdAt: Date;
}

const blockOutDateSchema = new Schema<IBlockOutDate>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      default: '',
      maxlength: 200,
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

blockOutDateSchema.index({ userId: 1, date: 1 }, { unique: true });
blockOutDateSchema.index({ userId: 1 });

const BlockOutDate = mongoose.model<IBlockOutDate>('BlockOutDate', blockOutDateSchema);
export default BlockOutDate;
