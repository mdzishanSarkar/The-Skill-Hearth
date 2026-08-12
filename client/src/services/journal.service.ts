import api from './api';
import type {
  JournalEntry,
  JournalListResult,
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
} from '../types/journal.types';

export async function listEntries(params: { page?: number; limit?: number } = {}): Promise<JournalListResult> {
  const { data } = await api.get('/journal', { params });
  return data.data;
}

export async function getEntry(id: string): Promise<JournalEntry> {
  const { data } = await api.get(`/journal/${id}`);
  return data.data.entry;
}

export async function listConnectionEntries(connectionId: string): Promise<JournalEntry[]> {
  const { data } = await api.get(`/journal/connection/${connectionId}`);
  return data.data.entries;
}

export async function createEntry(input: CreateJournalEntryInput): Promise<JournalEntry> {
  const { data } = await api.post('/journal', input);
  return data.data.entry;
}

export async function updateEntry(id: string, input: UpdateJournalEntryInput): Promise<JournalEntry> {
  const { data } = await api.put(`/journal/${id}`, input);
  return data.data.entry;
}

export async function deleteEntry(id: string): Promise<void> {
  await api.delete(`/journal/${id}`);
}
