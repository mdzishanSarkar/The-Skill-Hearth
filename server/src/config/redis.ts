import { createClient, type RedisClientType } from 'redis';

let client: RedisClientType | null = null;
let connecting: Promise<RedisClientType | null> | null = null;
let disabled = false;

function buildClient(): RedisClientType {
  const instance = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) =>
        retries > 3 ? false : Math.min(retries * 200, 1000),
    },
  });
  instance.on('error', () => {});
  return instance;
}

export async function getRedis(): Promise<RedisClientType | null> {
  if (client) return client;
  if (disabled) return null;
  if (connecting) return connecting;

  connecting = (async () => {
    if (!process.env.REDIS_URL) {
      disabled = true;
      return null;
    }
    try {
      const instance = buildClient();
      await instance.connect();
      client = instance;
      return instance;
    } catch {
      disabled = true;
      return null;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
}

export async function isRedisAvailable(): Promise<boolean> {
  return (await getRedis()) !== null;
}

export async function redisGet(key: string): Promise<string | null> {
  const redis = await getRedis();
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

export async function redisSetEx(
  key: string,
  seconds: number,
  value: string
): Promise<boolean> {
  const redis = await getRedis();
  if (!redis) return false;
  try {
    await redis.setEx(key, seconds, value);
    return true;
  } catch {
    return false;
  }
}

export async function redisIncr(key: string): Promise<number | null> {
  const redis = await getRedis();
  if (!redis) return null;
  try {
    return await redis.incr(key);
  } catch {
    return null;
  }
}

export async function redisExpire(key: string, seconds: number): Promise<boolean> {
  const redis = await getRedis();
  if (!redis) return false;
  try {
    return (await redis.expire(key, seconds)) === 1;
  } catch {
    return false;
  }
}

export async function redisPTTL(key: string): Promise<number | null> {
  const redis = await getRedis();
  if (!redis) return null;
  try {
    return await redis.pTTL(key);
  } catch {
    return null;
  }
}

export async function redisDel(key: string): Promise<boolean> {
  const redis = await getRedis();
  if (!redis) return false;
  try {
    const removed = await redis.del(key);
    return removed > 0;
  } catch {
    return false;
  }
}
