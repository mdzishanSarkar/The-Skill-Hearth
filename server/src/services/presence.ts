import { User, Connection, Friendship } from '../models';
import { getIO } from '../config/socket';
import { getRedis, redisDel, redisSetEx } from '../config/redis';

const PRESENCE_PREFIX = 'presence:';
const PRESENCE_FRIENDS_PREFIX = 'presence:friends:';
// Long enough to survive browser-throttled heartbeat intervals (~60s) while
// still pausing presence shortly after a real disconnect. Refreshed by the
// client's heartbeat and by server-side message activity.
const PRESENCE_TTL_SECONDS = 75;
const LAST_SEEN_TTL_SECONDS = 7 * 24 * 60 * 60;

// Tracks live sockets per user. A user is only "offline" once their LAST
// socket disconnects, so multiple tabs/devices and reconnects no longer
// flip an actively-texting user to offline.
const activeConnections = new Map<string, Set<string>>();

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

/**
 * All users this user can converse with: friendships plus accepted/completed
 * skill connections (both directions). Used to scope presence broadcasts so
 * skill-chat peers get real-time online indicators too.
 */
export async function getPresenceRecipients(userId: string): Promise<string[]> {
  const id = String(userId);
  const recipientIds = new Set<string>();
  for (const friendId of await getFriendIds(id)) {
    if (friendId !== id) recipientIds.add(friendId);
  }
  try {
    const [friendships, connections] = await Promise.all([
      Friendship.find({
        status: 'accepted',
        $or: [{ requesterId: id }, { addresseeId: id }],
      })
        .select('requesterId addresseeId')
        .lean(),
      Connection.find({
        status: { $in: ['accepted', 'completed'] },
        $or: [{ requesterId: id }, { teacherId: id }],
      })
        .select('requesterId teacherId')
        .lean(),
    ]);
    for (const f of friendships) {
      const other = String(f.requesterId) === id ? String(f.addresseeId) : String(f.requesterId);
      if (other !== id) recipientIds.add(other);
    }
    for (const c of connections) {
      const other = String(c.requesterId) === id ? String(c.teacherId) : String(c.requesterId);
      if (other !== id) recipientIds.add(other);
    }
  } catch {
    // best-effort
  }
  return [...recipientIds];
}

async function setOnlineFlag(userId: string, isOnline: boolean, lastSeen = new Date()): Promise<void> {
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

/**
 * Registers a connected socket and transitions the user to online when it is
 * their first socket. Returns the recipients who were notified (empty when
 * the user already had other active sockets).
 */
export async function onUserConnect(userId: string, socketId: string): Promise<string[]> {
  const id = String(userId);
  const sockets = activeConnections.get(id);
  const isFirstSocket = !sockets || sockets.size === 0;

  if (!sockets) activeConnections.set(id, new Set([socketId]));
  else sockets.add(socketId);

  if (!isFirstSocket) return [];

  await setOnlineFlag(id, true);
  await addToFriendSets(id);
  const recipients = await getPresenceRecipients(id);
  const io = getIO();
  for (const peerId of recipients) {
    io.to(`user_${peerId}`).emit('messenger:presence_update', { userId: id, isOnline: true });
    io.to(`user_${peerId}`).emit('friend:online', { userId: id });
  }
  return recipients;
}

/**
 * Unregisters a disconnected socket (idempotent) and transitions the user to
 * offline only when it was their last socket. Returns the recipients notified,
 * or an empty array if the user still has active sockets.
 */
export async function onUserDisconnect(userId: string, socketId: string): Promise<string[]> {
  const id = String(userId);
  const sockets = activeConnections.get(id);
  if (!sockets) return [];

  sockets.delete(socketId);
  if (sockets.size > 0) return [];

  activeConnections.delete(id);

  await setOnlineFlag(id, false);
  await removeFromFriendSets(id);
  const recipients = await getPresenceRecipients(id);
  const lastSeen = new Date();
  const io = getIO();
  for (const peerId of recipients) {
    io.to(`user_${peerId}`).emit('messenger:presence_update', {
      userId: id,
      isOnline: false,
      lastSeen: lastSeen.toISOString(),
    });
    io.to(`user_${peerId}`).emit('friend:offline', {
      userId: id,
      lastSeen: lastSeen.toISOString(),
    });
  }
  return recipients;
}

export async function setUserOnline(userId: string): Promise<void> {
  await setOnlineFlag(userId, true);
}

export async function setUserOffline(userId: string): Promise<void> {
  await setOnlineFlag(userId, false);
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
  const sockets = activeConnections.get(userId);
  if (sockets && sockets.size > 0) return true;
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
  activeConnections.delete(userId);
  await redisDel(presenceKey(userId));
}

export { presenceKey, friendsKey };