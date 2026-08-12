export interface MoodInfo {
  value: number;
  label: string;
  emoji: string;
}

export const MOODS: MoodInfo[] = [
  { value: 1, label: 'Rough', emoji: '😞' },
  { value: 2, label: 'Meh', emoji: '😕' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Great', emoji: '🤩' },
];

export function moodEmoji(mood: number | null | undefined): MoodInfo | undefined {
  return MOODS.find((m) => m.value === mood);
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}
