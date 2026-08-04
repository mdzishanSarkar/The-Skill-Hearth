import { NextFunction, Request, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

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

export const globalRateLimiter = rateLimit({
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

export function withRateLimit(
  limiter: ReturnType<typeof rateLimit>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => limiter(req, res, next);
}
