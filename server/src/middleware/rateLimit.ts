import { Request, Response, NextFunction } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { redisGet, redisSetEx, redisIncr, redisExpire, isRedisAvailable } from '../config/redis';
import { AuthRequest } from './auth';

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

function getTierFromRequest(req: Request): string {
  const authReq = req as AuthRequest;
  if (!authReq.userId) return 'guest';
  if ((authReq as any).user?.role === 'admin') return 'admin';
  if ((authReq as any).user?.role === 'moderator') return 'moderator';
  if ((authReq as any).user?.isPro) return 'pro';
  return 'user';
}

export async function tieredRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!(await isRedisAvailable())) {
    globalRateLimiterFallback(req, res, next);
    return;
  }

  const tier = getTierFromRequest(req);
  const maxRequests = TIER_LIMITS[tier] || TIER_LIMITS.user;
  const windowSeconds = 15 * 60;
  const userId = (req as AuthRequest).userId || 'anon';
  const key = `ratelimit:${tier}:${ipKeyGenerator(req.ip ?? '')}:${userId}`;

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
