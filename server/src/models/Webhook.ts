import mongoose, { Document, Schema, Types } from 'mongoose';

export type WebhookEvent =
  | 'session.completed'
  | 'member.joined'
  | 'skill.created'
  | 'review.created'
  | 'connection.completed';

export type WebhookStatus = 'active' | 'disabled' | 'failed';

export interface IWebhookLog {
  event: WebhookEvent;
  payload: Record<string, unknown>;
  statusCode?: number;
  success: boolean;
  error?: string;
  attemptedAt: Date;
}

export interface IWebhook extends Document {
  ownerId: Types.ObjectId;
  url: string;
  events: WebhookEvent[];
  secret: string;
  status: WebhookStatus;
  failCount: number;
  lastTriggeredAt?: Date;
  lastSuccessAt?: Date;
  logs: IWebhookLog[];
  createdAt: Date;
  updatedAt: Date;
}

const webhookLogSchema = new Schema<IWebhookLog>(
  {
    event: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    statusCode: { type: Number },
    success: { type: Boolean, required: true },
    error: { type: String },
    attemptedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const webhookSchema = new Schema<IWebhook>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    url: { type: String, required: true, maxlength: 500 },
    events: [{ type: String, required: true, enum: ['session.completed', 'member.joined', 'skill.created', 'review.created', 'connection.completed'] }],
    secret: { type: String, required: true, maxlength: 128 },
    status: { type: String, enum: ['active', 'disabled', 'failed'], default: 'active' },
    failCount: { type: Number, default: 0 },
    lastTriggeredAt: { type: Date },
    lastSuccessAt: { type: Date },
    logs: { type: [webhookLogSchema], default: [], select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        delete ret.secret;
        delete ret.logs;
        return ret;
      },
    },
  }
);

const Webhook = mongoose.models.Webhook || mongoose.model<IWebhook>('Webhook', webhookSchema);
export default Webhook;
