import { HttpError } from '../utils/errors';

const OPENAI_MODERATION_URL = 'https://api.openai.com/v1/moderations';

export interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  categoryScores: Record<string, number>;
}

export async function moderateText(text: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      flagged: false,
      categories: {},
      categoryScores: {},
    };
  }

  try {
    const response = await fetch(OPENAI_MODERATION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text.slice(0, 2000),
      }),
    });

    if (!response.ok) {
      console.error('Moderation API error:', response.status);
      return {
        flagged: false,
        categories: {},
        categoryScores: {},
      };
    }

    const data = await response.json();
    const result = data.results?.[0];

    if (!result) {
      return {
        flagged: false,
        categories: {},
        categoryScores: {},
      };
    }

    return {
      flagged: result.flagged || false,
      categories: result.categories || {},
      categoryScores: result.category_scores || {},
    };
  } catch (error) {
    console.error('Moderation API request failed:', error);
    return {
      flagged: false,
      categories: {},
      categoryScores: {},
    };
  }
}

const FLAGGED_CATEGORIES = [
  'harassment',
  'hate',
  'sexual',
  'sexual/minors',
  'violence',
  'self-harm',
] as const;

export function shouldFlagForReview(moderation: ModerationResult): boolean {
  if (moderation.flagged) return true;

  for (const category of FLAGGED_CATEGORIES) {
    const score = moderation.categoryScores[category] ?? 0;
    if (score > 0.7) return true;
  }

  return false;
}

export function getFlagReason(moderation: ModerationResult): string | null {
  if (!moderation.flagged) return null;

  const flaggedCategories: string[] = [];
  for (const [category, flagged] of Object.entries(moderation.categories)) {
    if (flagged) {
      flaggedCategories.push(category);
    }
  }

  if (flaggedCategories.length === 0) return null;
  return `Content flagged for: ${flaggedCategories.join(', ')}`;
}
