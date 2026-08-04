import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBlock extends Document {
  blockerId: Types.ObjectId;
  blockedId: Types.ObjectId;
  createdAt: Date;
}

const blockSchema = new Schema<IBlock>(
  {
    blockerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    blockedId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

blockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });
blockSchema.index({ blockedId: 1 });

const Block = mongoose.model<IBlock>('Block', blockSchema);
export default Block;
