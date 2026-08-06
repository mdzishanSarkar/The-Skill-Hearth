import { redisGet, redisSetEx, redisDel, isRedisAvailable } from '../config/redis';

const DEFAULT_TTL = 300;
const DISCOVERY_TTL = 120;

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!(await isRedisAvailable())) return null;
  try {
    const raw = await redisGet(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number = DEFAULT_TTL): Promise<boolean> {
  if (!(await isRedisAvailable())) return false;
  try {
    return await redisSetEx(key, ttlSeconds, JSON.stringify(value));
  } catch {
    return false;
  }
}

export async function cacheDel(key: string): Promise<boolean> {
  if (!(await isRedisAvailable())) return false;
  try {
    return await redisDel(key);
  } catch {
    return false;
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  if (!(await isRedisAvailable())) return;
  try {
    const { getRedis } = await import('../config/redis');
    const client = await getRedis();
    if (!client) return;

    const keys: string[] = [];
    for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      if (typeof key === 'string') {
        keys.push(key);
      }
    }
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch {
    // ignore
  }
}

export function skillCacheKey(id: string): string {
  return `skill:${id}`;
}

export function skillListCacheKey(filters: string): string {
  return `skills:list:${filters}`;
}

export function discoveryCacheKey(bbox: string, filters: string): string {
  return `discovery:${bbox}:${filters}`;
}

export function userCacheKey(id: string): string {
  return `user:${id}`;
}

export const CATEGORY_CACHE_KEY = 'categories:all';

export async function invalidateSkillCaches(skillId: string, userId?: string): Promise<void> {
  await cacheDel(skillCacheKey(skillId));
  await cacheDelPattern('skills:list:*');
  await cacheDelPattern('discovery:*');
  if (userId) {
    await cacheDelPattern(`user:${userId}:*`);
  }
}

export async function invalidateUserCaches(userId: string): Promise<void> {
  await cacheDel(userCacheKey(userId));
}

export { DEFAULT_TTL, DISCOVERY_TTL };
