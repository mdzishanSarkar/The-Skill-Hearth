import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISkillBundle extends Document {
  name: string;
  description: string;
  skillIds: Types.ObjectId[];
  isOfficial: boolean;
  createdBy: Types.ObjectId;
  votes: number;
  votedBy: Types.ObjectId[];
  coverImage: string;
  createdAt: Date;
  updatedAt: Date;
}

const skillBundleSchema = new Schema<ISkillBundle>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    skillIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Skill',
        required: true,
      },
    ],
    isOfficial: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    votes: {
      type: Number,
      default: 0,
    },
    votedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    coverImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        delete ret.votedBy;
        return ret;
      },
    },
  }
);

skillBundleSchema.index({ isOfficial: 1, votes: -1 });
skillBundleSchema.index({ createdBy: 1 });

const SkillBundle = mongoose.model<ISkillBundle>('SkillBundle', skillBundleSchema);
export default SkillBundle;
