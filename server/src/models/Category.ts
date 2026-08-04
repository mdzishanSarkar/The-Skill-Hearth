import mongoose, { Document, Schema } from 'mongoose';

export interface ISkillItem {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  icon: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  skills: ISkillItem[];
  createdAt: Date;
  updatedAt: Date;
}

const skillItemSchema = new Schema<ISkillItem>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    icon: {
      type: String,
      default: 'default',
    },
    description: {
      type: String,
      default: '',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    skills: {
      type: [skillItemSchema],
      default: [],
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

categorySchema.index({ displayOrder: 1 });
categorySchema.index({ isActive: 1, displayOrder: 1 });

const Category = mongoose.model<ICategory>('Category', categorySchema);
export default Category;
