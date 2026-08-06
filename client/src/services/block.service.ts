import api from './api';
import type { BlockedUsersResult } from '../types/block.types';

export async function blockUser(userId: string): Promise<void> {
  await api.post(`/blocks/${userId}`);
}

export async function unblockUser(userId: string): Promise<void> {
  await api.delete(`/blocks/${userId}`);
}

export async function getBlockedUsers(): Promise<BlockedUsersResult> {
  const { data } = await api.get('/blocks');
  return data.data;
}
