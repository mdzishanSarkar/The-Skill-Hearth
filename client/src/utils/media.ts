const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function resolveMediaUrl(src: string): string {
  if (!src) return src;
  if (/^https?:\/\//.test(src)) return src;
  if (src.startsWith('/uploads/')) {
    return `${API_BASE.replace(/\/api$/, '')}${src}`;
  }
  return src;
}
