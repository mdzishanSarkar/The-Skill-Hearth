export interface CalendarEvent {
  externalId: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

export interface CalendarIntegration {
  _id: string;
  userId: string;
  provider: 'google' | 'outlook';
  calendarId: string;
  calendarName: string;
  syncStatus: 'pending' | 'active' | 'error' | 'disabled';
  lastSyncedAt?: string;
  events: CalendarEvent[];
  createdAt: string;
  updatedAt: string;
}
