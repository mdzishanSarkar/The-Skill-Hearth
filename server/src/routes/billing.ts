import { Router } from 'express';
import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createCheckoutSession,
  createPortalSession,
  stripeWebhook,
  getSubscriptionStatus,
  createTip,
  confirmTip,
  promoteSkill,
  getImpactReport,
} from '../controllers/billing';

const router = Router();

router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

router.post('/checkout', authenticate, createCheckoutSession);
router.post('/portal', authenticate, createPortalSession);
router.get('/status', authenticate, getSubscriptionStatus);

router.post('/tips', authenticate, createTip);
router.post('/tips/:id/confirm', authenticate, confirmTip);

router.post('/promote', authenticate, promoteSkill);

router.get('/impact', authenticate, getImpactReport);

export default router;
