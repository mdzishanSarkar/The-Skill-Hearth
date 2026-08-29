import type { Server, Socket } from 'socket.io';
import { User, Friendship } from '../models';
import type { SocketUser } from '../types/socket.types';
import { onUserConnect, onUserDisconnect, heartbeat } from '../services/presence';
import { invalidateConversationCache } from '../services/conversation.service';
import { getDirectMessageRoomId } from '../services/friendship';

async function invalidatePeerCaches(recipients: string[], userId: string): Promise<void> {
  await invalidateConversationCache(userId).catch(() => {});
  await Promise.allSettled(recipients.map((id) => invalidateConversationCache(id)));
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

  socket.on('ping', () => {
    heartbeat(user.userId).catch(() => {});
    socket.emit('pong', { timestamp: Date.now() });
  });
}

export async function handleUserConnected(io: Server, socket: Socket, user: SocketUser) {
  const recipients = await onUserConnect(user.userId, socket.id);
  await invalidatePeerCaches(recipients, user.userId);
  void io;
}

export async function handleUserDisconnected(io: Server, socket: Socket, user: SocketUser) {
  const recipients = await onUserDisconnect(user.userId, socket.id);
  await invalidatePeerCaches(recipients, user.userId);
  void io;
}
