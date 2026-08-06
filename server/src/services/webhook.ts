import crypto from 'crypto';
import { Types } from 'mongoose';
import { Webhook, Connection, Notification, Skill, Review, User } from '../models';
import { HttpError } from '../utils/errors';

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

function generateSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

export interface CreateWebhookInput {
  ownerId: string;
  url: string;
  events: string[];
}

export async function createWebhook(input: CreateWebhookInput) {
  const webhook = await Webhook.create({
    ownerId: toObjectId(input.ownerId),
    url: input.url.trim(),
    events: input.events,
    secret: generateSecret(),
  });
  return webhook.toJSON();
}

export async function listWebhooks(ownerId: string) {
  return Webhook.find({ ownerId: toObjectId(ownerId) }).sort({ createdAt: -1 }).lean();
}

export async function deleteWebhook(webhookId: string, ownerId: string) {
  const webhook = await Webhook.findOneAndDelete({
    _id: toObjectId(webhookId),
    ownerId: toObjectId(ownerId),
  });
  if (!webhook) throw new HttpError(404, 'NOT_FOUND', 'Webhook not found');
  return { success: true };
}

export async function toggleWebhook(webhookId: string, ownerId: string) {
  const webhook = await Webhook.findOne({
    _id: toObjectId(webhookId),
    ownerId: toObjectId(ownerId),
  });
  if (!webhook) throw new HttpError(404, 'NOT_FOUND', 'Webhook not found');

  webhook.status = webhook.status === 'active' ? 'disabled' : 'active';
  await webhook.save();
  return webhook.toJSON();
}

type WebhookTriggerEvent =
  | 'session.completed'
  | 'member.joined'
  | 'skill.created'
  | 'review.created'
  | 'connection.completed';

export async function triggerEvent(event: WebhookTriggerEvent, payload: Record<string, unknown>) {
  const webhooks = await Webhook.find({ events: event, status: 'active' }).lean();

  for (const wh of webhooks) {
    try {
      const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
      const signature = crypto.createHmac('sha256', wh.secret).update(body).digest('hex');

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const resp = await fetch(wh.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      await Webhook.updateOne(
        { _id: wh._id },
        {
          $push: {
            logs: {
              event,
              payload,
              statusCode: resp.status,
              success: resp.ok,
              attemptedAt: new Date(),
            },
          },
          $set: { lastTriggeredAt: new Date() },
          $inc: { failCount: resp.ok ? 0 : 1 },
          ...(resp.ok ? { $set: { lastSuccessAt: new Date() } } : {}),
        }
      );

      if (!resp.ok) {
        await Webhook.updateOne({ _id: wh._id }, { $inc: { failCount: 1 } });
        if ((wh.failCount || 0) + 1 >= 5) {
          await Webhook.updateOne({ _id: wh._id }, { status: 'failed' });
        }
      }
    } catch (err) {
      await Webhook.updateOne(
        { _id: wh._id },
        {
          $push: {
            logs: {
              event,
              payload,
              success: false,
              error: err instanceof Error ? err.message : 'Unknown error',
              attemptedAt: new Date(),
            },
          },
          $set: { lastTriggeredAt: new Date() },
          $inc: { failCount: 1 },
        }
      );
    }
  }
}
