import mongoose, { Document, Schema, Types } from 'mongoose';

export type BotPlatform = 'slack' | 'discord';
export type BotStatus = 'active' | 'disabled' | 'error';

export interface IBotInstallation {
  externalId: string;
  name: string;
  platform: BotPlatform;
  accessToken: string;
  botToken: string;
  teamId?: string;
  teamName?: string;
  channelId?: string;
  channelName?: string;
  installedBy: Types.ObjectId;
  status: BotStatus;
  lastUsedAt?: Date;
  commandCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const botInstallationSchema = new Schema<IBotInstallation>(
  {
    externalId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 200 },
    platform: { type: String, enum: ['slack', 'discord'], required: true },
    accessToken: { type: String, required: true },
    botToken: { type: String, required: true },
    teamId: { type: String },
    teamName: { type: String },
    channelId: { type: String },
    channelName: { type: String },
    installedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'disabled', 'error'], default: 'active' },
    lastUsedAt: { type: Date },
    commandCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        delete ret.accessToken;
        delete ret.botToken;
        return ret;
      },
    },
  }
);

const BotInstallation = mongoose.models.BotInstallation || mongoose.model<IBotInstallation>('BotInstallation', botInstallationSchema);
export default BotInstallation;
