export type WebhookEvent =
  | 'session.completed'
  | 'member.joined'
  | 'skill.created'
  | 'review.created'
  | 'connection.completed';

export interface Webhook {
  _id: string;
  ownerId: string;
  url: string;
  events: WebhookEvent[];
  status: 'active' | 'disabled' | 'failed';
  failCount: number;
  lastTriggeredAt?: string;
  lastSuccessAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookInput {
  url: string;
  events: WebhookEvent[];
}
