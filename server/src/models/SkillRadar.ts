import mongoose, { Document, Schema, Types } from 'mongoose';

export type RadarSignalType =
  | 'search'
  | 'skill_view'
  | 'profile_view'
  | 'category_browse'
  | 'swap_declined'
  | 'message_sent'
  | 'endorsement_given';

export type RadarConfidence = 'high' | 'medium' | 'low';
export type RadarIntentStatus = 'active' | 'paused' | 'dismissed';
export type RadarFormat = 'online' | 'in-person' | 'either';

export interface ISkillRadarSignal {
  type: RadarSignalType;
  category?: string;
  skillName?: string;
  format?: string;
  timestamp: Date;
  weight: number;
}

export interface ISkillRadarIntent {
  category: string;
  inferredSkillNames: string[];
  confidence: RadarConfidence;
  preferredFormat: RadarFormat;
  preferredRadius?: number;
  reasoning: string;
  status: RadarIntentStatus;
  lastAlertedAt?: Date;
  alertedSkillIds: Types.ObjectId[];
  matchCount: number;
}

export interface IManualRadarFilter {
  category?: string;
  type?: 'teach' | 'learn';
  format?: string;
  proficiencyLevel?: string;
  radius?: number;
  availability?: string[];
}

export interface IManualRadar {
  _id?: Types.ObjectId;
  name: string;
  filters: IManualRadarFilter;
  lastAlertedAt?: Date;
  alertedSkillIds: Types.ObjectId[];
}

export interface ISkillRadar extends Document {
  userId: Types.ObjectId;
  signals: ISkillRadarSignal[];
  intents: ISkillRadarIntent[];
  manualRadars: IManualRadar[];
  createdAt: Date;
  updatedAt: Date;
}

const signalSchema = new Schema<ISkillRadarSignal>(
  {
    type: {
      type: String,
      enum: ['search', 'skill_view', 'profile_view', 'category_browse', 'swap_declined', 'message_sent', 'endorsement_given'],
      required: true,
    },
    category: { type: String },
    skillName: { type: String },
    format: { type: String, enum: ['online', 'in-person', 'either'] },
    timestamp: { type: Date, default: Date.now },
    weight: { type: Number, required: true },
  },
  { _id: false }
);

const intentSchema = new Schema<ISkillRadarIntent>(
  {
    category: { type: String, required: true, trim: true },
    inferredSkillNames: { type: [String], default: [] },
    confidence: { type: String, enum: ['high', 'medium', 'low'], required: true },
    preferredFormat: { type: String, enum: ['online', 'in-person', 'either'], default: 'either' },
    preferredRadius: { type: Number, min: 1, max: 500 },
    reasoning: { type: String, default: '' },
    status: { type: String, enum: ['active', 'paused', 'dismissed'], default: 'active' },
    lastAlertedAt: { type: Date },
    alertedSkillIds: { type: [Schema.Types.ObjectId], ref: 'Skill', default: [] },
    matchCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const manualRadarFilterSchema = new Schema<IManualRadarFilter>(
  {
    category: { type: String },
    type: { type: String, enum: ['teach', 'learn'] },
    format: { type: String, enum: ['in-person', 'online', 'either'] },
    proficiencyLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    radius: { type: Number, min: 1, max: 100 },
    availability: { type: [String], default: [] },
  },
  { _id: false }
);

const manualRadarSchema = new Schema<IManualRadar>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    filters: { type: manualRadarFilterSchema, default: () => ({}) },
    lastAlertedAt: { type: Date },
    alertedSkillIds: { type: [Schema.Types.ObjectId], ref: 'Skill', default: [] },
  },
  { _id: true, timestamps: false }
);

const skillRadarSchema = new Schema<ISkillRadar>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    signals: { type: [signalSchema], default: [] },
    intents: { type: [intentSchema], default: [] },
    manualRadars: { type: [manualRadarSchema], default: [] },
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

skillRadarSchema.index({ 'intents.category': 1 });

const SkillRadar = mongoose.model<ISkillRadar>('SkillRadar', skillRadarSchema);
export default SkillRadar;
