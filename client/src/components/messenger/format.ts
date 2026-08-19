import { format, isSameDay, isToday, isYesterday } from 'date-fns';

export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  return format(date, 'h:mm a');
}

export function formatConversationTime(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  if (date.getFullYear() === new Date().getFullYear()) return format(date, 'MMM d');
  return format(date, 'MMM d, yyyy');
}

export function formatDateDivider(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMMM d');
}

export function shouldShowDateDivider(currentIso: string | undefined, previousIso: string | undefined): boolean {
  if (!currentIso) return false;
  if (!previousIso) return true;
  return !isSameDay(new Date(currentIso), new Date(previousIso));
}

export function formatRelativeSeen(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return format(date, 'MMM d');
}
