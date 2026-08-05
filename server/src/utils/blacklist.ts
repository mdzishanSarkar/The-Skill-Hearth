import { TokenBlacklist } from '../models';
import { isRedisAvailable, redisGet, redisSetEx } from '../config/redis';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function blacklistKey(tokenId: string): string {
  return `blk:${tokenId}`;
}

export async function blacklistToken(
  tokenId: string,
  type: 'access' | 'refresh',
  ttlSeconds: number
): Promise<void> {
  const stored = await redisSetEx(blacklistKey(tokenId), ttlSeconds, type);
  if (stored) return;

  await TokenBlacklist.updateOne(
    { tokenId, type },
    { $setOnInsert: { expiresAt: new Date(Date.now() + ttlSeconds * 1000) } },
    { upsert: true }
  );
}

export async function isTokenBlacklisted(tokenId: string): Promise<boolean> {
  const value = await redisGet(blacklistKey(tokenId));
  if (value !== null) return true;
  if (await isRedisAvailable()) return false;

  const entry = await TokenBlacklist.findOne({ tokenId });
  return Boolean(entry);
}
