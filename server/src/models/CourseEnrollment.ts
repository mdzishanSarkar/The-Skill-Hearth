import mongoose, { Document, Schema, Types } from 'mongoose';

export type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'dropped';

export interface ISessionProgress {
  sessionIndex: number;
  completed: boolean;
  completedAt?: Date;
  notes?: string;
}

export interface ICourseEnrollment extends Document {
  courseId: Types.ObjectId;
  learnerId: Types.ObjectId;
  status: EnrollmentStatus;
  progress: ISessionProgress[];
  startedAt: Date;
  completedAt?: Date;
  certificateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionProgressSchema = new Schema<ISessionProgress>(
  {
    sessionIndex: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    notes: { type: String, maxlength: 500 },
  },
  { _id: false }
);

const enrollmentSchema = new Schema<ICourseEnrollment>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    learnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['enrolled', 'in_progress', 'completed', 'dropped'],
      default: 'enrolled',
    },
    progress: {
      type: [sessionProgressSchema],
      default: [],
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    certificateId: {
      type: String,
      sparse: true,
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

enrollmentSchema.index({ courseId: 1, learnerId: 1 }, { unique: true });
enrollmentSchema.index({ learnerId: 1, status: 1 });
enrollmentSchema.index({ courseId: 1, status: 1 });

const CourseEnrollment = mongoose.model<ICourseEnrollment>('CourseEnrollment', enrollmentSchema);
export default CourseEnrollment;
