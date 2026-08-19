import { getRedis } from '../config/redis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const MEMORY_LIMITER = new Map<string, number[]>();

function inMemoryCheck(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const timestamps = (MEMORY_LIMITER.get(key) ?? []).filter((ts) => now - ts < windowMs);
  if (timestamps.length >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - timestamps[0])) / 1000)),
    };
  }
  timestamps.push(now);
  MEMORY_LIMITER.set(key, timestamps);
  return { allowed: true, remaining: limit - timestamps.length, retryAfterSeconds: 0 };
}

/**
 * Sliding-window rate limiter backed by Redis (ZSET of timestamps).
 * Falls back to an in-memory limiter when Redis is unavailable.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redis = await getRedis();
  const windowMs = windowSeconds * 1000;
  if (!redis) return inMemoryCheck(key, limit, windowMs);

  const now = Date.now();
  try {
    const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;
    await redis.zAdd(key, { score: now, value: member });
    await redis.zRemRangeByScore(key, 0, now - windowMs);
    const count = await redis.zCard(key);
    await redis.expire(key, Math.max(windowSeconds, 1));

    if (count > limit) {
      const oldest = await redis.zRangeWithScores(key, 0, 0);
      const oldestTs = oldest[0] ? Number(oldest[0].score) : now;
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldestTs)) / 1000)),
      };
    }
    return { allowed: true, remaining: limit - count, retryAfterSeconds: 0 };
  } catch {
    return inMemoryCheck(key, limit, windowMs);
  }
}
