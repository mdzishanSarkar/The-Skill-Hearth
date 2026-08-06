import mongoose, { Document, Schema, Types } from 'mongoose';

export type ApiKeyStatus = 'active' | 'revoked';

export interface IApiKey extends Document {
  ownerId: Types.ObjectId;
  key: string;
  name: string;
  scopes: string[];
  status: ApiKeyStatus;
  rateLimit: number;
  requestCount: number;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    scopes: [{ type: String, enum: ['skills:read', 'stats:read', 'users:read'] }],
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
    rateLimit: { type: Number, default: 100 },
    requestCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date },
    expiresAt: { type: Date },
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

const ApiKey = mongoose.models.ApiKey || mongoose.model<IApiKey>('ApiKey', apiKeySchema);
export default ApiKey;
