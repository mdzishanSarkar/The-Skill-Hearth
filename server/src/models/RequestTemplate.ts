import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRequestTemplate extends Document {
  title: string;
  intro: string;
  body: string;
  categoryId?: Types.ObjectId;
  categoryName?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const requestTemplateSchema = new Schema<IRequestTemplate>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 80,
    },
    intro: {
      type: String,
      required: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: true,
      maxlength: 500,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'SkillCategory',
    },
    categoryName: {
      type: String,
      maxlength: 80,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

requestTemplateSchema.index({ categoryId: 1, isActive: 1 });

const RequestTemplate = mongoose.model<IRequestTemplate>('RequestTemplate', requestTemplateSchema);
export default RequestTemplate;
