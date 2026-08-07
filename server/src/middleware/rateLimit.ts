import { Request, Response, NextFunction } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { redisIncr, redisExpire, isRedisAvailable } from '../config/redis';
import User from '../models/User';
import { verifyAccessToken } from '../utils/jwt';

interface RateLimitInfoOnRequest {
  rateLimit?: {
    limit: number;
    used: number;
    remaining: number;
    resetTime?: Date;
  };
}

function formatResetTime(resetTime?: Date): string {
  if (!resetTime) return 'later';
  return resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function rateLimitHandler(req: Request, res: Response): void {
  const info = (req as RateLimitInfoOnRequest).rateLimit;
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Too many requests. Please try again after ${formatResetTime(info?.resetTime)}.`,
    },
  });
}

// Fallback in-memory limiters when Redis is unavailable
const globalRateLimiterFallback = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip ?? '')}:${String((req.body?.email ?? '') as string).toLowerCase()}`,
  handler: rateLimitHandler,
});

export const emailRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip ?? '')}:${String((req.body?.email ?? '') as string).toLowerCase()}`,
  handler: rateLimitHandler,
});

// Tiered rate limits by user role/subscription
const TIER_LIMITS: Record<string, number> = {
  guest: 30,
  user: 200,
  pro: 500,
  moderator: 500,
  admin: 1000,
};

// Paths that must never be throttled: health checks and static file serving.
const RATE_LIMIT_EXEMPT_PATHS = [/^\/api\/health(?:\/|$)/, /^\/uploads(?:\/|$)/];

// The global tiered limiter runs before route auth middleware, so it must
// resolve the requester itself from the access token instead of relying on
// req.userId (which is only set by `authenticate` later in the pipeline).
async function resolveTier(req: Request): Promise<{ tier: string; key: string }> {
  const authHeader = req.headers.authorization;
  let userId: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    userId = verifyAccessToken(authHeader.slice(7))?.userId ?? null;
  }

  const guestKey = `guest:${ipKeyGenerator(req.ip ?? '')}:anon`;
  if (!userId) return { tier: 'guest', key: guestKey };

  const user = await User.findById(userId).select('role isPro').lean();
  if (!user) return { tier: 'guest', key: guestKey };

  const tier =
    user.role === 'admin' ? 'admin'
    : user.role === 'moderator' ? 'moderator'
    : user.isPro ? 'pro'
    : 'user';

  return { tier, key: `${tier}:${userId}` };
}

export async function tieredRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (RATE_LIMIT_EXEMPT_PATHS.some((pattern) => pattern.test(req.path))) {
    return next();
  }

  if (!(await isRedisAvailable())) {
    globalRateLimiterFallback(req, res, next);
    return;
  }

  let tier: string;
  let keySuffix: string;
  try {
    const resolved = await resolveTier(req);
    tier = resolved.tier;
    keySuffix = resolved.key;
  } catch {
    // Degrade gracefully: never block traffic because tiering failed.
    return next();
  }

  const maxRequests = TIER_LIMITS[tier] || TIER_LIMITS.user;
  const windowSeconds = 15 * 60;
  const key = `ratelimit:${keySuffix}`;

  try {
    const current = await redisIncr(key);
    if (current === null) {
      return next();
    }

    if (current === 1) {
      await redisExpire(key, windowSeconds);
    }

    const remaining = Math.max(0, maxRequests - current);
    const ttl = await redisPTTL(key);
    const resetTime = ttl !== null && ttl > 0 ? new Date(Date.now() + ttl) : undefined;

    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', resetTime ? Math.ceil(resetTime.getTime() / 1000).toString() : '');

    if (current > maxRequests) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Please try again after ${formatResetTime(resetTime)}.`,
        },
      });
      return;
    }

    next();
  } catch {
    next();
  }
}

async function redisPTTL(key: string): Promise<number | null> {
  try {
    const { getRedis } = await import('../config/redis');
    const client = await getRedis();
    if (!client) return null;
    const result = await client.pTTL(key);
    return result > 0 ? result : null;
  } catch {
    return null;
  }
}

export function withRateLimit(
  limiter: ReturnType<typeof rateLimit>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => limiter(req, res, next);
}
