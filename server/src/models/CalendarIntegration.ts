import mongoose, { Document, Schema, Types } from 'mongoose';

export type CalendarProvider = 'google' | 'outlook';
export type CalendarSyncStatus = 'pending' | 'active' | 'error' | 'disabled';

export interface ICalendarEvent {
  externalId: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  connectionId?: Types.ObjectId;
}

export interface ICalendarIntegration extends Document {
  userId: Types.ObjectId;
  provider: CalendarProvider;
  accessToken: string;
  refreshToken: string;
  calendarId: string;
  calendarName: string;
  syncStatus: CalendarSyncStatus;
  lastSyncedAt?: Date;
  syncToken?: string;
  events: ICalendarEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const calendarEventSchema = new Schema<ICalendarEvent>(
  {
    externalId: { type: String, required: true },
    title: { type: String, required: true, maxlength: 200 },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    description: { type: String, maxlength: 1000 },
    location: { type: String, maxlength: 300 },
    connectionId: { type: Schema.Types.ObjectId, ref: 'Connection' },
  },
  { _id: false }
);

const calendarIntegrationSchema = new Schema<ICalendarIntegration>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, enum: ['google', 'outlook'], required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    calendarId: { type: String, required: true },
    calendarName: { type: String, default: 'Primary' },
    syncStatus: { type: String, enum: ['pending', 'active', 'error', 'disabled'], default: 'pending' },
    lastSyncedAt: { type: Date },
    syncToken: { type: String },
    events: { type: [calendarEventSchema], default: [], select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        delete ret.accessToken;
        delete ret.refreshToken;
        return ret;
      },
    },
  }
);

const CalendarIntegration = mongoose.models.CalendarIntegration || mongoose.model<ICalendarIntegration>('CalendarIntegration', calendarIntegrationSchema);
export default CalendarIntegration;
