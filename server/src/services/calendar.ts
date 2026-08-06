import { Types } from 'mongoose';
import { CalendarIntegration, Connection, Notification } from '../models';
import { HttpError } from '../utils/errors';

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

export interface ConnectCalendarInput {
  userId: string;
  provider: 'google' | 'outlook';
  accessToken: string;
  refreshToken: string;
  calendarId: string;
  calendarName?: string;
}

export async function connectCalendar(input: ConnectCalendarInput) {
  const existing = await CalendarIntegration.findOne({
    userId: toObjectId(input.userId),
    provider: input.provider,
  });
  if (existing) {
    existing.accessToken = input.accessToken;
    existing.refreshToken = input.refreshToken;
    existing.calendarId = input.calendarId;
    existing.calendarName = input.calendarName || existing.calendarName;
    existing.syncStatus = 'active';
    await existing.save();
    return existing.toJSON();
  }

  const integration = await CalendarIntegration.create({
    userId: toObjectId(input.userId),
    provider: input.provider,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
    calendarId: input.calendarId,
    calendarName: input.calendarName || 'Primary',
    syncStatus: 'active',
  });

  return integration.toJSON();
}

export async function getCalendarIntegration(userId: string, provider: string) {
  const integration = await CalendarIntegration.findOne({
    userId: toObjectId(userId),
    provider,
  }).lean();
  if (!integration) throw new HttpError(404, 'NOT_FOUND', 'Calendar integration not found');
  return integration;
}

export async function disconnectCalendar(userId: string, provider: string) {
  const integration = await CalendarIntegration.findOneAndDelete({
    userId: toObjectId(userId),
    provider,
  });
  if (!integration) throw new HttpError(404, 'NOT_FOUND', 'Calendar integration not found');
  return { success: true };
}

export async function syncConnectionToCalendar(
  userId: string,
  connectionId: string,
  provider: string
) {
  const integration = await CalendarIntegration.findOne({
    userId: toObjectId(userId),
    provider,
    syncStatus: 'active',
  });
  if (!integration) {
    throw new HttpError(404, 'CALENDAR_NOT_CONNECTED', 'No active calendar integration found');
  }

  const connection = await Connection.findById(toObjectId(connectionId)).lean();
  if (!connection) {
    throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Connection not found');
  }

  const event = {
    externalId: `conn-${connectionId}-${Date.now()}`,
    title: `Skill Session`,
    start: connection.completedAt || new Date(),
    end: new Date((connection.completedAt || new Date()).getTime() + 60 * 60 * 1000),
    description: `Skill sharing session via The Skill Hearth`,
    location: '',
    connectionId: toObjectId(connectionId),
  };

  integration.events.push(event);
  integration.lastSyncedAt = new Date();
  await integration.save();

  return event;
}

export async function listCalendarEvents(userId: string, provider: string) {
  const integration = await CalendarIntegration.findOne({
    userId: toObjectId(userId),
    provider,
  }).select('+events').lean();
  if (!integration) throw new HttpError(404, 'NOT_FOUND', 'Calendar integration not found');
  return integration.events;
}

export async function removeCalendarEvent(
  userId: string,
  provider: string,
  externalId: string
) {
  const integration = await CalendarIntegration.findOne({
    userId: toObjectId(userId),
    provider,
  });
  if (!integration) throw new HttpError(404, 'NOT_FOUND', 'Calendar integration not found');

    integration.events = integration.events.filter((e: any) => e.externalId !== externalId);
  await integration.save();
  return { success: true };
}
