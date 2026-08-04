import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEndorsement extends Document {
  endorserId: Types.ObjectId;
  endorseeId: Types.ObjectId;
  skillId: Types.ObjectId;
  connectionId: Types.ObjectId;
  createdAt: Date;
}

const endorsementSchema = new Schema<IEndorsement>(
  {
    endorserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    endorseeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    connectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Connection',
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

endorsementSchema.index({ endorserId: 1, endorseeId: 1, skillId: 1 }, { unique: true });
endorsementSchema.index({ endorseeId: 1 });
endorsementSchema.index({ skillId: 1 });

const Endorsement = mongoose.model<IEndorsement>('Endorsement', endorsementSchema);
export default Endorsement;
