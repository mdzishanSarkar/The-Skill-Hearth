import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('');
const DOMPurify = createDOMPurify(window as unknown as Window & typeof globalThis);

export const ALLOWED_TAGS: string[] = [];
export const ALLOWED_ATTR: string[] = [];

export function sanitizeText(input: unknown): string {
  const value = typeof input === 'string' ? input : String(input ?? '');
  const cleaned = DOMPurify.sanitize(value, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
  });

  return cleaned.replace(/\s+/g, ' ').trim();
}
