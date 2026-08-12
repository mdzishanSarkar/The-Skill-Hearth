import api from './api';
import type {
  GamificationProfileResult,
  PublicGamification,
  LeaderboardResult,
  FriendsStreakEntry,
} from '../types/gamification.types';

export async function getGamificationProfile(): Promise<GamificationProfileResult> {
  const { data } = await api.get('/gamification/profile');
  return data.data;
}

export async function getPublicGamification(userId: string): Promise<PublicGamification> {
  const { data } = await api.get(`/gamification/public/${userId}`);
  return data.data.profile;
}

export async function getLeaderboard(scope: 'global' | 'local' = 'local'): Promise<LeaderboardResult> {
  const { data } = await api.get('/gamification/leaderboard', { params: { scope } });
  return data.data;
}

export async function freezeStreak(type: 'teaching' | 'learning' | 'logging'): Promise<void> {
  await api.post('/gamification/streak/freeze', { type });
}

export async function getFriendsStreaks(): Promise<FriendsStreakEntry[]> {
  const { data } = await api.get('/gamification/friends-streaks');
  return data.data.streaks;
}
