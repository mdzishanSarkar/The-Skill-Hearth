import api from './api';
import type { CalendarIntegration, CalendarEvent } from '../types/calendar.types';

export async function getCalendarIntegration(
  provider: string
): Promise<CalendarIntegration> {
  const { data } = await api.get('/calendars', { params: { provider } });
  return data.data.integration;
}

export async function connectCalendar(input: {
  provider: string;
  accessToken: string;
  refreshToken: string;
  calendarId: string;
  calendarName?: string;
}): Promise<CalendarIntegration> {
  const { data } = await api.post('/calendars', input);
  return data.data.integration;
}

export async function disconnectCalendar(provider: string): Promise<void> {
  await api.delete(`/calendars/${provider}`);
}

export async function syncConnection(
  connectionId: string,
  provider: string
): Promise<CalendarEvent> {
  const { data } = await api.post('/calendars/sync', { connectionId, provider });
  return data.data.event;
}

export async function listCalendarEvents(provider: string): Promise<CalendarEvent[]> {
  const { data } = await api.get('/calendars/events', { params: { provider } });
  return data.data.events;
}

export async function removeCalendarEvent(
  provider: string,
  externalId: string
): Promise<void> {
  await api.delete(`/calendars/${provider}/events/${externalId}`);
}
