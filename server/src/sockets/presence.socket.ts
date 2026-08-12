import type { Server, Socket } from 'socket.io';
import { User, Friendship } from '../models';
import type { SocketUser } from '../types/socket.types';
import { setUserOnline, setUserOffline } from '../services/presence';
import { getDirectMessageRoomId } from '../services/friendship';

async function getFriendIds(userId: string): Promise<string[]> {
  const user = await User.findById(userId).select('friendIds').lean();
  return (user?.friendIds ?? []).map((id) => String(id));
}

function emitToFriends(
  io: Server,
  friendIds: string[],
  event: string,
  payload: unknown,
  excludeSocket?: Socket,
) {
  for (const friendId of friendIds) {
    io.to(`user_${friendId}`).emit(event, payload);
  }
  void excludeSocket;
}

export function setupPresenceSockets(io: Server, socket: Socket, user: SocketUser) {
  socket.on('dm:join', async (otherUserId: string) => {
    if (!otherUserId) return;
    const friendship = await Friendship.findOne({
      status: 'accepted',
      $or: [
        { requesterId: user.userId, addresseeId: otherUserId },
        { requesterId: otherUserId, addresseeId: user.userId },
      ],
    }).lean();
    if (!friendship) return;
    socket.join(getDirectMessageRoomId(user.userId, otherUserId));
  });

  socket.on('dm:leave', (otherUserId: string) => {
    if (!otherUserId) return;
    socket.leave(getDirectMessageRoomId(user.userId, otherUserId));
  });
}

export async function handleUserConnected(io: Server, socket: Socket, user: SocketUser) {
  const friendIds = await getFriendIds(user.userId);
  socket.data.friendIds = friendIds;
  await setUserOnline(user.userId);
  emitToFriends(io, friendIds, 'friend:online', { userId: user.userId });
}

export async function handleUserDisconnected(io: Server, socket: Socket, user: SocketUser) {
  const friendIds = (socket.data.friendIds as string[] | undefined) ?? (await getFriendIds(user.userId));
  await setUserOffline(user.userId);
  emitToFriends(io, friendIds, 'friend:offline', {
    userId: user.userId,
    lastSeen: new Date().toISOString(),
  });
}
