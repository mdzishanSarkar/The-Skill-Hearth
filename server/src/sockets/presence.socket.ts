import type { Server, Socket } from 'socket.io';
import { User, Friendship } from '../models';
import type { SocketUser } from '../types/socket.types';
import { onUserConnect, onUserDisconnect, heartbeat } from '../services/presence';
import { getDirectMessageRoomId } from '../services/friendship';

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

  socket.on('ping', () => {
    heartbeat(user.userId).catch(() => {});
    socket.emit('pong', { timestamp: Date.now() });
  });
}

export async function handleUserConnected(io: Server, socket: Socket, user: SocketUser) {
  await onUserConnect(user.userId);
  void io;
  void socket;
}

export async function handleUserDisconnected(io: Server, socket: Socket, user: SocketUser) {
  await onUserDisconnect(user.userId);
  void io;
  void socket;
}
