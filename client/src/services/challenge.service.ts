import api from './api';
import type {
  Challenge,
  ChallengeListResult,
  CreateChallengeInput,
  LeaderboardEntry,
} from '../types/challenge.types';

export async function createChallenge(input: CreateChallengeInput): Promise<Challenge> {
  const { data } = await api.post('/challenges', input);
  return data.data.challenge;
}

export async function listChallenges(
  params: { status?: string; skillCategory?: string; page?: number; limit?: number } = {}
): Promise<ChallengeListResult> {
  const { data } = await api.get('/challenges', { params });
  return data.data;
}

export async function getChallenge(id: string): Promise<Challenge> {
  const { data } = await api.get(`/challenges/${id}`);
  return data.data.challenge;
}

export async function joinChallenge(id: string): Promise<Challenge> {
  const { data } = await api.post(`/challenges/${id}/join`);
  return data.data.challenge;
}

export async function updateProgress(id: string, progress: number): Promise<Challenge> {
  const { data } = await api.put(`/challenges/${id}/progress`, { progress });
  return data.data.challenge;
}

export async function getLeaderboard(id: string): Promise<LeaderboardEntry[]> {
  const { data } = await api.get(`/challenges/${id}/leaderboard`);
  return data.data.leaderboard;
}
