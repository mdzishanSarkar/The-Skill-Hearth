import {
  isRedisAvailable,
  redisDel,
  redisExpire,
  redisIncr,
  redisPTTL,
  redisSetEx,
} from '../config/redis';

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_WINDOW_SECONDS = 15 * 60;
export const LOGIN_LOCK_SECONDS = 15 * 60;

const WINDOW_MS = LOGIN_WINDOW_SECONDS * 1000;
const LOCK_MS = LOGIN_LOCK_SECONDS * 1000;

function attemptsKey(email: string, ip?: string): string {
  return `la:c:${email}:${ip || 'unknown'}`;
}

function lockKey(email: string, ip?: string): string {
  return `la:l:${email}:${ip || 'unknown'}`;
}

const memoryStore = new Map<
  string,
  { count: number; windowStart: number; lockUntil: number }
>();

function memoryKey(email: string, ip?: string): string {
  return `${email.toLowerCase()}:${ip || 'unknown'}`;
}

export async function isLoginLocked(email: string, ip?: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();

  if (await isRedisAvailable()) {
    const ttl = await redisPTTL(lockKey(normalized, ip));
    return ttl !== null && ttl > 0;
  }

  const entry = memoryStore.get(memoryKey(normalized, ip));
  if (!entry) return false;
  if (entry.lockUntil > Date.now()) return true;
  if (entry.windowStart + WINDOW_MS < Date.now()) {
    memoryStore.delete(memoryKey(normalized, ip));
  }
  return false;
}

export async function recordLoginFailure(email: string, ip?: string): Promise<void> {
  const normalized = email.toLowerCase().trim();

  if (await isRedisAvailable()) {
    const count = await redisIncr(attemptsKey(normalized, ip));
    if (count === 1) await redisExpire(attemptsKey(normalized, ip), LOGIN_WINDOW_SECONDS);
    if (count !== null && count >= MAX_LOGIN_ATTEMPTS) {
      await redisSetEx(lockKey(normalized, ip), LOGIN_LOCK_SECONDS, '1');
      await redisDel(attemptsKey(normalized, ip));
    }
    return;
  }

  const key = memoryKey(normalized, ip);
  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry || entry.windowStart + WINDOW_MS < now) {
    memoryStore.set(key, { count: 1, windowStart: now, lockUntil: 0 });
    return;
  }
  entry.count += 1;
  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    entry.lockUntil = now + LOCK_MS;
  }
}

export async function clearLoginFailures(email: string, ip?: string): Promise<void> {
  const normalized = email.toLowerCase().trim();

  if (await isRedisAvailable()) {
    await redisDel(attemptsKey(normalized, ip));
    await redisDel(lockKey(normalized, ip));
    return;
  }

  memoryStore.delete(memoryKey(normalized, ip));
}
