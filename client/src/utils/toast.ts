import toast from 'react-hot-toast';

const DEDUPE_WINDOW_MS = 3000;

const recentToasts = new Map<string, number>();

function isDuplicate(message: string): boolean {
  const now = Date.now();
  const lastShown = recentToasts.get(message);
  if (lastShown !== undefined && now - lastShown < DEDUPE_WINDOW_MS) {
    return true;
  }
  recentToasts.set(message, now);
  return false;
}

export function showError(message: string): void {
  if (isDuplicate(message)) return;
  toast.error(message);
}

export function showSuccess(message: string): void {
  if (isDuplicate(message)) return;
  toast.success(message);
}

export function showToast(message: string): void {
  if (isDuplicate(message)) return;
  toast(message);
}
