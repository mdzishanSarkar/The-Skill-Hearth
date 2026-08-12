export interface JournalSkillRef {
  id: string;
  name: string;
  emoji?: string;
  category?: string;
}

export interface JournalEntry {
  id: string;
  connectionId: string;
  connectionStatus?: string;
  skill: JournalSkillRef | null;
  prompt: string;
  content: string;
  mood: 1 | 2 | 3 | 4 | 5 | null;
  isHighlighted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalListResult {
  entries: JournalEntry[];
  total: number;
  page: number;
  pages: number;
}

export interface CreateJournalEntryInput {
  connectionId: string;
  prompt?: string;
  content: string;
  mood?: number;
  isHighlighted?: boolean;
}

export interface UpdateJournalEntryInput {
  prompt?: string;
  content?: string;
  mood?: number;
  isHighlighted?: boolean;
}
