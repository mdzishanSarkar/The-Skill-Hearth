import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISkillMedia {
  url: string;
  publicId: string;
}

export interface ISkillLocation {
  city: string;
  zipCode: string;
  neighborhood: string;
  type: 'Point';
  coordinates: [number, number];
  radiusPreference: number;
}

export interface ISkill extends Document {
  userId: Types.ObjectId;
  type: 'teach' | 'learn';
  categoryId: Types.ObjectId;
  categoryName: string;
  skillName: string;
  description: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced';
  format: 'in-person' | 'online' | 'either';
  sessionLength: '30min' | '1hr' | '2hr+';
  showOnMap: boolean;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  isPromoted: boolean;
  promotionExpiresAt?: Date;
  media: ISkillMedia[];
  location: ISkillLocation;
  stats: {
    averageRating: number;
    reviewCount: number;
    completedSessionCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const skillMediaSchema = new Schema<ISkillMedia>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const skillLocationSchema = new Schema<ISkillLocation>(
  {
    city: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    neighborhood: { type: String, default: '' },
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: {
      type: [Number],
      default: [0, 0],
      validate: {
        validator: (v: number[]) => v.length === 2,
        message: 'Coordinates must be [lng, lat]',
      },
    },
    radiusPreference: { type: Number, default: 5, min: 1, max: 100 },
  },
  { _id: false }
);

const skillSchema = new Schema<ISkill>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['teach', 'learn'],
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
    },
    skillName: {
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
    proficiencyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    format: {
      type: String,
      enum: ['in-person', 'online', 'either'],
      required: true,
    },
    sessionLength: {
      type: String,
      enum: ['30min', '1hr', '2hr+'],
      required: true,
    },
    showOnMap: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: undefined,
    },
    isPromoted: {
      type: Boolean,
      default: false,
    },
    promotionExpiresAt: {
      type: Date,
      default: undefined,
    },
    media: {
      type: [skillMediaSchema],
      default: [],
      validate: {
        validator: (v: ISkillMedia[]) => v.length <= 5,
        message: 'Maximum 5 images per skill',
      },
    },
    location: {
      type: skillLocationSchema,
      required: true,
    },
    stats: {
      averageRating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
      completedSessionCount: { type: Number, default: 0 },
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

skillSchema.index({ userId: 1, type: 1 });
skillSchema.index({ type: 1, categoryId: 1, isActive: 1 });
skillSchema.index({ format: 1, isActive: 1 });
skillSchema.index({ isActive: 1, 'stats.averageRating': -1 });
skillSchema.index({ isActive: 1, createdAt: -1 });
skillSchema.index({ isActive: 1, 'stats.reviewCount': -1, createdAt: -1 });
skillSchema.index({ isPromoted: 1, promotionExpiresAt: 1 });
skillSchema.index({ isDeleted: 1, userId: 1, type: 1 });
skillSchema.index({ 'location.coordinates': '2dsphere' });
skillSchema.index(
  { skillName: 'text', description: 'text' },
  { weights: { skillName: 10, description: 3 }, name: 'skill_text_search' }
);

const Skill = mongoose.model<ISkill>('Skill', skillSchema);
export default Skill;
