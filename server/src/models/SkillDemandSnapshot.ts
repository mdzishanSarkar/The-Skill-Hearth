import mongoose, { Document, Schema } from 'mongoose';

export interface IDemandRegion {
  name: string;
  count: number;
}

export interface IDemandSkill {
  skillName: string;
  categoryName: string;
  demandScore: number;
  topRegions: IDemandRegion[];
}

export interface ISkillDemandSnapshot extends Document {
  skills: IDemandSkill[];
  windowStart: Date;
  windowEnd: Date;
  createdAt: Date;
}

const demandSkillSchema = new Schema<IDemandSkill>(
  {
    skillName: { type: String, required: true, trim: true },
    categoryName: { type: String, required: true, trim: true },
    demandScore: { type: Number, required: true, min: 1 },
    topRegions: {
      type: [
        {
          _id: false,
          name: { type: String, required: true },
          count: { type: Number, required: true },
        },
      ],
      default: [],
    },
  },
  { _id: false }
);

const skillDemandSnapshotSchema = new Schema<ISkillDemandSnapshot>(
  {
    skills: { type: [demandSkillSchema], default: [] },
    windowStart: { type: Date, required: true },
    windowEnd: { type: Date, required: true },
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

skillDemandSnapshotSchema.index({ createdAt: -1 });

const SkillDemandSnapshot = mongoose.model<ISkillDemandSnapshot>(
  'SkillDemandSnapshot',
  skillDemandSnapshotSchema
);
export default SkillDemandSnapshot;
