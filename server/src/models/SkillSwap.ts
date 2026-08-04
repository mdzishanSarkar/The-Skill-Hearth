import mongoose, { Document, Schema, Types } from 'mongoose';

export type SwapStatus = 'suggested' | 'accepted' | 'declined';

export interface ISkillSwap extends Document {
  userAId: Types.ObjectId;
  userBId: Types.ObjectId;
  userATeachesSkillId: Types.ObjectId;
  userBTeachesSkillId: Types.ObjectId;
  status: SwapStatus;
  declinedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const skillSwapSchema = new Schema<ISkillSwap>(
  {
    userAId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userBId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userATeachesSkillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    userBTeachesSkillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    status: {
      type: String,
      enum: ['suggested', 'accepted', 'declined'],
      default: 'suggested',
    },
    declinedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

skillSwapSchema.index({ userAId: 1, status: 1 });
skillSwapSchema.index({ userBId: 1, status: 1 });
skillSwapSchema.index({ status: 1, createdAt: -1 });
skillSwapSchema.index(
  { userAId: 1, userBId: 1, userATeachesSkillId: 1, userBTeachesSkillId: 1 },
  { unique: true }
);

const SkillSwap = mongoose.model<ISkillSwap>('SkillSwap', skillSwapSchema);
export default SkillSwap;
