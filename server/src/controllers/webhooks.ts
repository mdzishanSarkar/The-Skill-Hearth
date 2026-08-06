import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as webhookService from '../services/webhook';
import { asyncHandler } from '../utils/errors';

export const createWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { url, events } = req.body || {};
  if (!url || !events || !Array.isArray(events) || events.length === 0) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'url and events[] are required' },
    });
    return;
  }
  const webhook = await webhookService.createWebhook({
    ownerId: req.userId!,
    url,
    events,
  });
  res.status(201).json({ success: true, data: { webhook } });
});

export const listWebhooks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const webhooks = await webhookService.listWebhooks(req.userId!);
  res.json({ success: true, data: { webhooks } });
});

export const deleteWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await webhookService.deleteWebhook(String(req.params.id), req.userId!);
  res.json({ success: true, data: result });
});

export const toggleWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
  const webhook = await webhookService.toggleWebhook(String(req.params.id), req.userId!);
  res.json({ success: true, data: { webhook } });
});
