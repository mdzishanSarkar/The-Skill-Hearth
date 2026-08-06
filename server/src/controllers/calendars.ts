import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as calendarService from '../services/calendar';
import { asyncHandler } from '../utils/errors';

export const connectCalendar = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { provider, accessToken, refreshToken, calendarId, calendarName } = req.body || {};
  if (!provider || !accessToken || !refreshToken || !calendarId) {
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'provider, accessToken, refreshToken, and calendarId are required',
      },
    });
    return;
  }
  if (!['google', 'outlook'].includes(provider)) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'provider must be "google" or "outlook"' },
    });
    return;
  }
  const integration = await calendarService.connectCalendar({
    userId: req.userId!,
    provider,
    accessToken,
    refreshToken,
    calendarId,
    calendarName,
  });
  res.status(201).json({ success: true, data: { integration } });
});

export const getCalendarIntegration = asyncHandler(async (req: AuthRequest, res: Response) => {
  const provider = String(req.query.provider || '');
  if (!provider || !['google', 'outlook'].includes(provider)) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'provider query parameter is required' },
    });
    return;
  }
  const integration = await calendarService.getCalendarIntegration(
    req.userId!,
    String(provider)
  );
  res.json({ success: true, data: { integration } });
});

export const disconnectCalendar = asyncHandler(async (req: AuthRequest, res: Response) => {
  const provider = String(req.params.provider);
  const result = await calendarService.disconnectCalendar(req.userId!, provider);
  res.json({ success: true, data: result });
});

export const syncConnection = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { connectionId, provider } = req.body || {};
  if (!connectionId || !provider) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'connectionId and provider are required' },
    });
    return;
  }
  const event = await calendarService.syncConnectionToCalendar(
    req.userId!,
    connectionId,
    provider
  );
  res.status(201).json({ success: true, data: { event } });
});

export const listCalendarEvents = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { provider } = req.query;
  if (!provider) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'provider query parameter is required' },
    });
    return;
  }
  const events = await calendarService.listCalendarEvents(req.userId!, String(provider));
  res.json({ success: true, data: { events } });
});

export const removeCalendarEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const externalId = String(req.params.externalId);
  const provider = String(req.params.provider);
  const result = await calendarService.removeCalendarEvent(req.userId!, provider, externalId);
  res.json({ success: true, data: result });
});
