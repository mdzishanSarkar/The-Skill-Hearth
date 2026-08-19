import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BubbleAccentId = 'blue' | 'teal' | 'green' | 'purple' | 'pink' | 'rose' | 'amber';

export interface BubbleAccent {
  id: BubbleAccentId;
  label: string;
  from: string;
  to: string;
}

export const BUBBLE_ACCENTS: BubbleAccent[] = [
  { id: 'blue', label: 'Blue', from: '#1c92ff', to: '#0f73f5' },
  { id: 'teal', label: 'Teal', from: '#0d9488', to: '#0f766e' },
  { id: 'green', label: 'Green', from: '#10b981', to: '#047857' },
  { id: 'purple', label: 'Purple', from: '#8b5cf6', to: '#6d28d9' },
  { id: 'pink', label: 'Pink', from: '#ec4899', to: '#be185d' },
  { id: 'rose', label: 'Rose', from: '#f43f5e', to: '#be123c' },
  { id: 'amber', label: 'Amber', from: '#d97706', to: '#92400e' },
];

export const DEFAULT_BUBBLE_ACCENT = BUBBLE_ACCENTS[0];

interface ChatSettingsState {
  bubbleAccentId: BubbleAccentId;
  setBubbleAccentId: (id: BubbleAccentId) => void;
}

export const useChatSettingsStore = create<ChatSettingsState>()(
  persist(
    (set) => ({
      bubbleAccentId: DEFAULT_BUBBLE_ACCENT.id,
      setBubbleAccentId: (id) => set({ bubbleAccentId: id }),
    }),
    { name: 'skill-hearth:chat-settings' },
  ),
);