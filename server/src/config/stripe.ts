import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: '2025-07-30.basil' as Stripe.LatestApiVersion,
    typescript: true,
  });

  return stripeInstance;
}

export const STRIPE_PLANS = {
  PRO_MONTHLY: {
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
    name: 'Pro Monthly',
    amount: 499,
    interval: 'month' as const,
  },
  PRO_ANNUAL: {
    priceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || 'price_pro_annual',
    name: 'Pro Annual',
    amount: 3900,
    interval: 'year' as const,
  },
} as const;

export const PRO_PRICE_IDS = [
  STRIPE_PLANS.PRO_MONTHLY.priceId,
  STRIPE_PLANS.PRO_ANNUAL.priceId,
] as const;

export function isProPriceId(priceId: string): boolean {
  return (PRO_PRICE_IDS as readonly string[]).includes(priceId);
}

export const TIP_PERCENTAGE = 0.10;
export const MIN_TIP_CENTS = 100;
export const MAX_TIP_CENTS = 2000;

export const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
