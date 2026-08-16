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

export const TIP_PERCENTAGE = 0.10;
export const MIN_TIP_CENTS = 100;
export const MAX_TIP_CENTS = 2000;
