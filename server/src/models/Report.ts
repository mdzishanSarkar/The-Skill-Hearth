import mongoose, { Document, Schema, Types } from 'mongoose';

export type ReportTargetType = 'user' | 'skill' | 'message' | 'review' | 'post';

export type ReportReason =
  | 'harassment'
  | 'inappropriate'
  | 'spam'
  | 'fake'
  | 'no-show'
  | 'misleading'
  | 'other';

export type ReportStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export type ReportAction = 'warn' | 'suspend' | 'ban' | 'remove_content' | 'no_action';

export interface IReport extends Document {
  reporterId: Types.ObjectId;
  targetType: ReportTargetType;
  targetId: Types.ObjectId;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  assignedTo?: Types.ObjectId;
  action?: ReportAction;
  resolution?: string;
  contextMessages?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: ['user', 'skill', 'message', 'review', 'post'],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      enum: ['harassment', 'inappropriate', 'spam', 'fake', 'no-show', 'misleading', 'other'],
      required: true,
    },
    description: {
      type: String,
      maxlength: 300,
    },
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'dismissed'],
      default: 'open',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      enum: ['warn', 'suspend', 'ban', 'remove_content', 'no_action'],
    },
    resolution: {
      type: String,
      maxlength: 500,
    },
    contextMessages: [{
      type: Schema.Types.ObjectId,
      ref: 'Message',
    }],
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

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ assignedTo: 1, status: 1 });
reportSchema.index({ reporterId: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1, status: 1 });
reportSchema.index({ status: 1, createdAt: 1 });

const Report = mongoose.model<IReport>('Report', reportSchema);
export default Report;
