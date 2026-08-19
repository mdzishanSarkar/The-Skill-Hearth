import { User } from '../models';
import { getIO } from '../config/socket';
import { getRedis, redisDel, redisSetEx } from '../config/redis';

const PRESENCE_PREFIX = 'presence:';
const PRESENCE_FRIENDS_PREFIX = 'presence:friends:';
const PRESENCE_TTL_SECONDS = 35;
const LAST_SEEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const onlineUsers = new Set<string>();

function presenceKey(userId: string): string {
  return `${PRESENCE_PREFIX}${userId}`;
}

function friendsKey(userId: string): string {
  return `${PRESENCE_FRIENDS_PREFIX}${userId}`;
}

async function getFriendIds(userId: string): Promise<string[]> {
  const user = await User.findById(userId).select('friendIds').lean();
  return (user?.friendIds ?? []).map((id) => String(id));
}

async function setOnlineFlag(userId: string, isOnline: boolean, lastSeen = new Date()): Promise<void> {
  onlineUsers[isOnline ? 'add' : 'delete'](userId);
  const redis = await getRedis();
  if (!redis) return;
  try {
    const ttl = isOnline ? PRESENCE_TTL_SECONDS : LAST_SEEN_TTL_SECONDS;
    await redis.hSet(presenceKey(userId), {
      isOnline: isOnline ? '1' : '0',
      lastSeen: lastSeen.toISOString(),
    });
    await redis.expire(presenceKey(userId), ttl);
  } catch {
    // best-effort
  }
}

async function addToFriendSets(userId: string): Promise<void> {
  const redis = await getRedis();
  const friends = await getFriendIds(userId);
  if (!redis) return;
  try {
    const pipeline = redis.multi();
    for (const friendId of friends) {
      pipeline.sAdd(friendsKey(friendId), userId);
    }
    await pipeline.exec();
  } catch {
    // best-effort
  }
}

async function removeFromFriendSets(userId: string): Promise<void> {
  const redis = await getRedis();
  const friends = await getFriendIds(userId);
  if (!redis) return;
  try {
    const pipeline = redis.multi();
    for (const friendId of friends) {
      pipeline.sRem(friendsKey(friendId), userId);
    }
    await pipeline.exec();
  } catch {
    // best-effort
  }
}

export async function setUserOnline(userId: string): Promise<void> {
  await setOnlineFlag(userId, true);
}

export async function setUserOffline(userId: string): Promise<void> {
  await setOnlineFlag(userId, false);
}

export async function onUserConnect(userId: string): Promise<void> {
  await setOnlineFlag(userId, true);
  await addToFriendSets(userId);
  const friends = await getFriendIds(userId);
  const io = getIO();
  for (const friendId of friends) {
    io.to(`user_${friendId}`).emit('messenger:presence_update', {
      userId,
      isOnline: true,
    });
    io.to(`user_${friendId}`).emit('friend:online', { userId });
  }
}

export async function onUserDisconnect(userId: string): Promise<void> {
  await setOnlineFlag(userId, false);
  await removeFromFriendSets(userId);
  const friends = await getFriendIds(userId);
  const lastSeen = new Date();
  const io = getIO();
  for (const friendId of friends) {
    io.to(`user_${friendId}`).emit('messenger:presence_update', {
      userId,
      isOnline: false,
      lastSeen: lastSeen.toISOString(),
    });
    io.to(`user_${friendId}`).emit('friend:offline', {
      userId,
      lastSeen: lastSeen.toISOString(),
    });
  }
}

export async function heartbeat(userId: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  try {
    await redis.expire(presenceKey(userId), PRESENCE_TTL_SECONDS);
  } catch {
    // best-effort
  }
}

export async function isUserOnline(userId: string): Promise<boolean> {
  if (onlineUsers.has(userId)) return true;
  const redis = await getRedis();
  if (!redis) return false;
  try {
    const flag = await redis.hGet(presenceKey(userId), 'isOnline');
    return flag === '1';
  } catch {
    return false;
  }
}

export async function getLastSeen(userId: string): Promise<Date | null> {
  const redis = await getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.hGet(presenceKey(userId), 'lastSeen');
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export async function filterOnlineUsers(userIds: string[]): Promise<string[]> {
  const results = await Promise.all(userIds.map((id) => isUserOnline(id)));
  return userIds.filter((_, i) => results[i]);
}

export async function getOnlineFriends(userId: string): Promise<string[]> {
  const redis = await getRedis();
  if (!redis) return [];
  try {
    const candidates = await redis.sMembers(friendsKey(userId));
    if (!candidates.length) return [];
    const online: string[] = [];
    for (const id of candidates) {
      if (await isUserOnline(id)) online.push(id);
    }
    return online;
  } catch {
    return [];
  }
}

export async function invalidatePresenceCache(userId: string): Promise<void> {
  onlineUsers.delete(userId);
  await redisDel(presenceKey(userId));
}

export { presenceKey, friendsKey };
