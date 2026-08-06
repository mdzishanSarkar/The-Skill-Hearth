import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as billingService from '../services/billing';
import { asyncHandler } from '../utils/errors';
import { WEBHOOK_SECRET, getStripe } from '../config/stripe';

export const createCheckoutSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { plan } = req.body || {};
  if (!plan || !['monthly', 'annual'].includes(plan)) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'plan must be "monthly" or "annual"' },
    });
    return;
  }
  const successUrl = req.body.successUrl || `${process.env.CLIENT_URL}/upgrade?success=true`;
  const cancelUrl = req.body.cancelUrl || `${process.env.CLIENT_URL}/upgrade`;
  const result = await billingService.createCheckoutSession(req.userId!, plan, successUrl, cancelUrl);
  res.json({ success: true, data: result });
});

export const createPortalSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const returnUrl = req.body.returnUrl || `${process.env.CLIENT_URL}/settings`;
  const result = await billingService.createCustomerPortalSession(req.userId!, returnUrl);
  res.json({ success: true, data: result });
});

export const stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  if (!WEBHOOK_SECRET) {
    res.status(503).json({ success: false, error: { code: 'WEBHOOK_DISABLED', message: 'Stripe webhook not configured' } });
    return;
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    res.status(400).json({ success: false, error: { code: 'MISSING_SIGNATURE', message: 'Missing stripe-signature header' } });
    return;
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } });
    return;
  }

  await billingService.handleStripeWebhook(event);
  res.json({ received: true });
});

export const getSubscriptionStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const status = await billingService.getSubscriptionStatus(req.userId!);
  res.json({ success: true, data: status });
});

export const createTip = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { payeeId, connectionId, amount } = req.body || {};
  if (!payeeId || !connectionId || !amount) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'payeeId, connectionId, and amount are required' },
    });
    return;
  }
  const result = await billingService.createTip({
    payerId: req.userId!,
    payeeId: String(payeeId),
    connectionId: String(connectionId),
    amount: Number(amount),
  });
  res.status(201).json({ success: true, data: result });
});

export const confirmTip = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await billingService.confirmTipPayment(String(req.params.id));
  res.json({ success: true, data: { tip: result } });
});

export const promoteSkill = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { skillId, duration } = req.body || {};
  if (!skillId || ![7, 30].includes(Number(duration))) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'skillId and duration (7 or 30) are required' },
    });
    return;
  }
  const result = await billingService.promoteSkill(req.userId!, String(skillId), Number(duration) as 7 | 30);
  res.json({ success: true, data: result });
});

export const getImpactReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const report = await billingService.getImpactReport(req.userId!);
  res.json({ success: true, data: report });
});
