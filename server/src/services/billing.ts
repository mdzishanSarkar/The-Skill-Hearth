import { Types } from 'mongoose';
import Stripe from 'stripe';
import { User, Connection, Skill, Tip } from '../models';
import { getStripe, STRIPE_PLANS, TIP_PERCENTAGE, MIN_TIP_CENTS, MAX_TIP_CENTS } from '../config/stripe';
import { HttpError } from '../utils/errors';

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await User.findById(toObjectId(userId));
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');

  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId: user._id.toString() },
  });

  user.stripeCustomerId = customer.id;
  await user.save();

  return customer.id;
}

export async function createCheckoutSession(
  userId: string,
  plan: 'monthly' | 'annual',
  successUrl: string,
  cancelUrl: string
) {
  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(userId);

  const priceId = plan === 'annual'
    ? STRIPE_PLANS.PRO_ANNUAL.priceId
    : STRIPE_PLANS.PRO_MONTHLY.priceId;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, plan },
    subscription_data: {
      metadata: { userId },
    },
  });

  return { sessionId: session.id, url: session.url };
}

export async function createCustomerPortalSession(userId: string, returnUrl: string) {
  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}

export async function handleStripeWebhook(event: Stripe.Event) {
  const stripe = getStripe();
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const periodEnd = (subscription as any).current_period_end;
        await User.findByIdAndUpdate(userId, {
          isPro: true,
          stripeSubscriptionId: subscription.id,
          proExpiresAt: new Date(periodEnd * 1000),
        });
      }
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        const periodEnd = (subscription as any).current_period_end;
        await User.findByIdAndUpdate(userId, {
          isPro: isActive,
          proExpiresAt: periodEnd ? new Date(periodEnd * 1000) : undefined,
        });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          isPro: false,
          stripeSubscriptionId: undefined,
          proExpiresAt: undefined,
        });
      }
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as any;
      const subscriptionId = invoice.subscription as string;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.userId;
        if (userId && subscription.status === 'past_due') {
          await User.findByIdAndUpdate(userId, { isPro: false });
        }
      }
      break;
    }
  }
}

export async function getSubscriptionStatus(userId: string) {
  const user = await User.findById(toObjectId(userId)).select('isPro proExpiresAt stripeSubscriptionId');
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');

  if (!user.isPro || !user.proExpiresAt) {
    return { isPro: false, plan: null, expiresAt: null, cancelAtPeriodEnd: false };
  }

  let cancelAtPeriodEnd = false;
  if (user.stripeSubscriptionId) {
    try {
      const stripe = getStripe();
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      cancelAtPeriodEnd = subscription.cancel_at_period_end;
    } catch {
      // subscription may have been deleted
    }
  }

  return {
    isPro: user.isPro,
    plan: user.proExpiresAt > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'annual' : 'monthly',
    expiresAt: user.proExpiresAt,
    cancelAtPeriodEnd,
  };
}

export interface CreateTipInput {
  payerId: string;
  payeeId: string;
  connectionId: string;
  amount: number;
}

export async function createTip(input: CreateTipInput) {
  const amount = Math.round(input.amount);
  if (amount < MIN_TIP_CENTS || amount > MAX_TIP_CENTS) {
    throw new HttpError(422, 'VALIDATION_ERROR', `Tip must be between $${MIN_TIP_CENTS / 100} and $${MAX_TIP_CENTS / 100}`);
  }
  if (input.payerId === input.payeeId) {
    throw new HttpError(400, 'CANNOT_TIP_SELF', 'You cannot tip yourself');
  }

  const connection = await Connection.findOne({
    _id: toObjectId(input.connectionId),
    status: 'completed',
    $or: [
      { requesterId: toObjectId(input.payerId), teacherId: toObjectId(input.payeeId) },
      { requesterId: toObjectId(input.payeeId), teacherId: toObjectId(input.payerId) },
    ],
  });
  if (!connection) {
    throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'No completed connection found');
  }

  const existingTip = await Tip.findOne({
    payerId: toObjectId(input.payerId),
    connectionId: toObjectId(input.connectionId),
    status: { $in: ['pending', 'completed'] },
  });
  if (existingTip) {
    throw new HttpError(409, 'TIP_ALREADY_EXISTS', 'You have already sent a tip for this session');
  }

  const platformFee = Math.round(amount * TIP_PERCENTAGE);
  const tip = await Tip.create({
    payerId: toObjectId(input.payerId),
    payeeId: toObjectId(input.payeeId),
    connectionId: toObjectId(input.connectionId),
    amount,
    platformFee,
    status: 'pending',
  });

  const stripe = getStripe();
  const payee = await User.findById(toObjectId(input.payeeId)).select('stripeCustomerId displayName');
  let stripeAccountId = payee?.stripeCustomerId;

  if (!stripeAccountId) {
    const payeeStripe = await stripe.accounts.create({
      type: 'express',
      email: payee?.displayName || 'unknown',
      metadata: { userId: input.payeeId },
    });
    stripeAccountId = payeeStripe.id;
    await User.findByIdAndUpdate(input.payeeId, { stripeCustomerId: payeeStripe.id });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    application_fee_amount: platformFee,
    transfer_data: { destination: stripeAccountId },
    metadata: { tipId: tip._id.toString(), payerId: input.payerId, payeeId: input.payeeId },
  });

  tip.stripePaymentIntentId = paymentIntent.id;
  tip.status = 'pending';
  await tip.save();

  return {
    tip: tip.toJSON(),
    clientSecret: paymentIntent.client_secret,
  };
}

export async function confirmTipPayment(tipId: string) {
  const tip = await Tip.findById(toObjectId(tipId));
  if (!tip) throw new HttpError(404, 'TIP_NOT_FOUND', 'Tip not found');

  if (tip.stripePaymentIntentId) {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(tip.stripePaymentIntentId);
    if (paymentIntent.status === 'succeeded') {
      tip.status = 'completed';
      await tip.save();
    }
  }

  return tip.toJSON();
}

export async function promoteSkill(
  userId: string,
  skillId: string,
  duration: 7 | 30
) {
  const skill = await Skill.findOne({
    _id: toObjectId(skillId),
    userId: toObjectId(userId),
    isDeleted: false,
  });
  if (!skill) throw new HttpError(404, 'SKILL_NOT_FOUND', 'Skill not found or does not belong to you');

  if (skill.isPromoted && skill.promotionExpiresAt && skill.promotionExpiresAt > new Date()) {
    throw new HttpError(409, 'ALREADY_PROMOTED', 'This skill is already promoted');
  }

  const amount = duration === 7 ? 999 : 2999;
  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Featured Skill Listing (${duration} days)`,
          description: `Boost your "${skill.skillName}" listing for ${duration} days`,
        },
        unit_amount: amount,
      },
      quantity: 1,
    }],
    success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/my-skills?promoted=true`,
    cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/my-skills`,
    metadata: { userId, skillId, duration: String(duration) },
  });

  return { sessionId: session.id, url: session.url };
}

export async function activatePromotion(skillId: string, duration: 7 | 30) {
  const skill = await Skill.findById(toObjectId(skillId));
  if (!skill) throw new HttpError(404, 'SKILL_NOT_FOUND', 'Skill not found');

  skill.isPromoted = true;
  skill.promotionExpiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
  await skill.save();

  return skill.toJSON();
}

export async function getImpactReport(userId: string) {
  const user = await User.findById(toObjectId(userId)).select('displayName location stats');
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');

  const connections = await Connection.find({
    $or: [
      { requesterId: toObjectId(userId) },
      { teacherId: toObjectId(userId) },
    ],
  }).populate('skillId', 'skillName categoryName');

  const completed = connections.filter((c) => c.status === 'completed');
  const neighborhoods = new Set<string>();
  const skillsTaught = new Set<string>();
  const skillsLearned = new Set<string>();

  for (const conn of connections) {
    if (conn.skillId && typeof conn.skillId === 'object' && 'skillName' in conn.skillId) {
      const skill = conn.skillId as unknown as { skillName: string; categoryName: string };
      if (String(conn.teacherId) === userId) {
        skillsTaught.add(skill.skillName);
      } else {
        skillsLearned.add(skill.skillName);
      }
    }
  }

  const userSkills = await Skill.find({ userId: toObjectId(userId), isDeleted: false });
  for (const skill of userSkills) {
    if (skill.location?.neighborhood) neighborhoods.add(skill.location.neighborhood);
    if (skill.location?.city) neighborhoods.add(skill.location.city);
  }

  return {
    user: {
      displayName: user.displayName,
      memberSince: user.createdAt,
    },
    stats: {
      sessionsCompleted: completed.length,
      totalConnections: connections.length,
      skillsShared: skillsTaught.size,
      skillsLearned: skillsLearned.size,
      neighborhoodsReached: neighborhoods.size,
    },
    skills: {
      teaching: Array.from(skillsTaught),
      learning: Array.from(skillsLearned),
    },
  };
}
