import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  performedBy: Types.ObjectId;
  action: string;
  targetType: string;
  targetId: Types.ObjectId;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ['user', 'skill', 'review', 'message', 'report', 'post', 'connection', 'category'],
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    before: {
      type: Schema.Types.Mixed,
    },
    after: {
      type: Schema.Types.Mixed,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;
