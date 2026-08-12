import { getRedis } from '../config/redis';

const PRESENCE_PREFIX = 'presence:user:';
const onlineUsers = new Set<string>();

export async function setUserOnline(userId: string): Promise<void> {
  onlineUsers.add(userId);
  const redis = await getRedis();
  if (redis) {
    try {
      await redis.setEx(`${PRESENCE_PREFIX}${userId}`, 300, new Date().toISOString());
    } catch {
      // best-effort
    }
  }
}

export async function setUserOffline(userId: string): Promise<void> {
  onlineUsers.delete(userId);
  const redis = await getRedis();
  if (redis) {
    try {
      await redis.del(`${PRESENCE_PREFIX}${userId}`);
    } catch {
      // best-effort
    }
  }
}

export async function isUserOnline(userId: string): Promise<boolean> {
  if (onlineUsers.has(userId)) return true;
  const redis = await getRedis();
  if (!redis) return false;
  try {
    const exists = await redis.exists(`${PRESENCE_PREFIX}${userId}`);
    return exists === 1;
  } catch {
    return false;
  }
}

export async function filterOnlineUsers(userIds: string[]): Promise<string[]> {
  const results = await Promise.all(userIds.map((id) => isUserOnline(id)));
  return userIds.filter((_, i) => results[i]);
}
