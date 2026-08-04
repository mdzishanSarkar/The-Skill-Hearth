import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISavedSearchFilter {
  category?: string;
  format?: string;
  type?: 'teach' | 'learn';
  radius?: number;
  availability?: string[];
  proficiencyLevel?: string;
}

export interface ISavedSearch extends Document {
  userId: Types.ObjectId;
  name: string;
  filters: ISavedSearchFilter;
  alertEnabled: boolean;
  lastAlertSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const savedSearchSchema = new Schema<ISavedSearch>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    filters: {
      category: { type: String },
      format: { type: String, enum: ['in-person', 'online', 'either'] },
      type: { type: String, enum: ['teach', 'learn'] },
      radius: { type: Number, min: 1, max: 100 },
      availability: [String],
      proficiencyLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    },
    alertEnabled: {
      type: Boolean,
      default: false,
    },
    lastAlertSentAt: {
      type: Date,
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

savedSearchSchema.index({ userId: 1 });

const SavedSearch = mongoose.model<ISavedSearch>('SavedSearch', savedSearchSchema);
export default SavedSearch;
