import api from './api';
import type {
  FriendSummary,
  FriendRequest,
  FriendSuggestion,
  FriendStatus,
  OnlineFriend,
  MutualFriend,
  FriendTier,
} from '../types/friends.types';

export async function listFriends(query?: string): Promise<FriendSummary[]> {
  const { data } = await api.get('/friends', { params: query ? { q: query } : {} });
  return data.data.friends;
}

export async function getIncomingRequests(): Promise<FriendRequest[]> {
  const { data } = await api.get('/friends/requests/incoming');
  return data.data.requests;
}

export async function getOutgoingRequests(): Promise<FriendRequest[]> {
  const { data } = await api.get('/friends/requests/outgoing');
  return data.data.requests;
}

export async function sendFriendRequest(userId: string): Promise<void> {
  await api.post(`/friends/requests/${userId}`);
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  await api.put(`/friends/requests/${requestId}/accept`);
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  await api.put(`/friends/requests/${requestId}/decline`);
}

export async function cancelFriendRequest(requestId: string): Promise<void> {
  await api.delete(`/friends/requests/${requestId}`);
}

export async function unfriend(userId: string): Promise<void> {
  await api.delete(`/friends/${userId}`);
}

export async function setFriendTier(userId: string, tier: FriendTier): Promise<void> {
  await api.put(`/friends/${userId}/tier`, { tier });
}

export async function updateFriendPrivacy(userId: string, showStreak: boolean): Promise<void> {
  await api.put(`/friends/${userId}/privacy`, { showStreak });
}

export async function getFriendStatus(userId: string): Promise<FriendStatus> {
  const { data } = await api.get(`/friends/status/${userId}`);
  return data.data.status;
}

export async function getMutualFriends(userId: string): Promise<MutualFriend[]> {
  const { data } = await api.get(`/friends/${userId}/mutual`);
  return data.data.mutual;
}

export async function getFriendSuggestions(): Promise<FriendSuggestion[]> {
  const { data } = await api.get('/friends/suggestions');
  return data.data.suggestions;
}

export async function getFriendsOnline(): Promise<OnlineFriend[]> {
  const { data } = await api.get('/friends/online');
  return data.data.online;
}
