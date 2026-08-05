import api from './api';
import type { BlockOutDate } from '../types/social.types';

export async function getBlockOutDates(): Promise<BlockOutDate[]> {
  const { data } = await api.get('/blockout-dates');
  return (data.data as { dates: BlockOutDate[] }).dates;
}

export async function addBlockOutDate(date: string, reason: string): Promise<BlockOutDate> {
  const { data } = await api.post('/blockout-dates', { date, reason });
  return (data.data as { date: BlockOutDate }).date;
}

export async function removeBlockOutDate(blockOutId: string): Promise<void> {
  await api.delete(`/blockout-dates/${blockOutId}`);
}
