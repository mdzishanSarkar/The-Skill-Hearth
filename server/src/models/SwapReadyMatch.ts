import mongoose, { Document, Schema, Types } from 'mongoose';

export type SwapReadyMatchStatus = 'available' | 'hidden' | 'proposed' | 'accepted' | 'declined';

export interface ISwapReadyMatch extends Document {
  userAId: Types.ObjectId;
  userATeachesSkillId: Types.ObjectId;
  userBId: Types.ObjectId;
  userBTeachesSkillId: Types.ObjectId;
  status: SwapReadyMatchStatus;
  lastMatchDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const swapReadyMatchSchema = new Schema<ISwapReadyMatch>(
  {
    userAId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userATeachesSkillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    userBId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userBTeachesSkillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'hidden', 'proposed', 'accepted', 'declined'],
      default: 'available',
    },
    lastMatchDate: {
      type: Date,
      default: Date.now,
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

swapReadyMatchSchema.index({ userAId: 1, status: 1, lastMatchDate: -1 });
swapReadyMatchSchema.index({ userBId: 1, status: 1, lastMatchDate: -1 });
swapReadyMatchSchema.index(
  { userAId: 1, userATeachesSkillId: 1, userBId: 1, userBTeachesSkillId: 1 },
  { unique: true }
);

const SwapReadyMatch = mongoose.model<ISwapReadyMatch>('SwapReadyMatch', swapReadyMatchSchema);
export default SwapReadyMatch;
