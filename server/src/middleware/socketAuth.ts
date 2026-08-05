import type { Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { isTokenBlacklisted } from '../utils/blacklist';
import User from '../models/User';
import type { SocketUser } from '../types/socket.types';

export async function socketAuth(socket: Socket): Promise<SocketUser | null> {
  const token =
    (socket.handshake.auth?.token as string) ||
    (socket.handshake.headers?.authorization?.startsWith('Bearer ')
      ? socket.handshake.headers.authorization.split(' ')[1]
      : null);

  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload) return null;

  if (await isTokenBlacklisted(payload.tokenId)) return null;

  const user = await User.findById(payload.userId).select('displayName status');
  if (!user || user.status !== 'active') return null;

  return { userId: String(user._id), displayName: user.displayName };
}
