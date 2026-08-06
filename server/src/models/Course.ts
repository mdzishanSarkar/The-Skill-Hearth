import mongoose, { Document, Schema, Types } from 'mongoose';

export type CourseStatus = 'draft' | 'published' | 'archived';

export interface ICourseSession {
  title: string;
  description: string;
  objectives: string[];
  order: number;
  estimatedMinutes: number;
}

export interface ICourse extends Document {
  teacherId: Types.ObjectId;
  skillId: Types.ObjectId;
  title: string;
  description: string;
  sessions: ICourseSession[];
  maxEnrollments: number;
  enrollmentCount: number;
  status: CourseStatus;
  totalEstimatedMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const courseSessionSchema = new Schema<ICourseSession>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, maxlength: 500, default: '' },
    objectives: { type: [String], default: [] },
    order: { type: Number, required: true, min: 0 },
    estimatedMinutes: { type: Number, default: 60, min: 15, max: 480 },
  },
  { _id: false }
);

const courseSchema = new Schema<ICourse>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skillId: {
      type: Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    sessions: {
      type: [courseSessionSchema],
      default: [],
      validate: {
        validator: (v: ICourseSession[]) => v.length >= 3 && v.length <= 6,
        message: 'Course must have 3 to 6 sessions',
      },
    },
    maxEnrollments: {
      type: Number,
      default: 20,
      min: 1,
      max: 50,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    totalEstimatedMinutes: {
      type: Number,
      default: 0,
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

courseSchema.index({ teacherId: 1, status: 1 });
courseSchema.index({ skillId: 1, status: 1 });
courseSchema.index({ status: 1, createdAt: -1 });

const Course = mongoose.model<ICourse>('Course', courseSchema);
export default Course;
