export interface CategoryVisual {
  emoji: string;
  gradient: string;
  badge: 'indigo' | 'green' | 'amber' | 'gray' | 'red' | 'orange' | 'purple' | 'blue' | 'teal';
  text: string;
}

export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  'Food & Cooking': {
    emoji: '🍳',
    gradient: 'from-orange-400 to-red-400',
    badge: 'orange',
    text: 'text-orange-600',
  },
  'Home & Garden': {
    emoji: '🌱',
    gradient: 'from-green-400 to-emerald-500',
    badge: 'green',
    text: 'text-green-600',
  },
  'Textile & Craft': {
    emoji: '🧵',
    gradient: 'from-purple-400 to-fuchsia-500',
    badge: 'purple',
    text: 'text-purple-600',
  },
  'Digital Literacy': {
    emoji: '💻',
    gradient: 'from-blue-400 to-indigo-500',
    badge: 'blue',
    text: 'text-blue-600',
  },
  'Languages & Communication': {
    emoji: '💬',
    gradient: 'from-teal-400 to-cyan-500',
    badge: 'teal',
    text: 'text-teal-600',
  },
};

const FALLBACK_VISUAL: CategoryVisual = {
  emoji: '📚',
  gradient: 'from-gray-400 to-gray-600',
  badge: 'gray',
  text: 'text-gray-600',
};

const SKILL_EMOJI: Record<string, string> = {
  'baking': '🥖',
  'fermentation & preserving': '🫙',
  'fermentationandpreserving': '🫙',
  'knife skills': '🔪',
  'knifeskills': '🔪',
  'meal prep': '🍱',
  'mealprep': '🍱',
  'basic plumbing': '🔧',
  'basicplumbing': '🔧',
  'vegetable gardening': '🥕',
  'vegetablegardening': '🥕',
  'composting': '🍂',
  'basic electrical': '💡',
  'basicelectrical': '💡',
  'sewing & mending': '🪡',
  'sewing&mending': '🪡',
  'knitting / crochet': '🧶',
  'knitting/crochet': '🧶',
  'knittingcrochet': '🧶',
  'upcycling': '♻️',
  'smartphone basics': '📱',
  'smartphonebasics': '📱',
  'email & video calls': '📧',
  'email&videocalls': '📧',
  'online safety': '🛡️',
  'onlinesafety': '🛡️',
  'conversational language practice': '🗣️',
  'conversationallanguagepractice': '🗣️',
  'writing & reading': '✍️',
  'writing&reading': '✍️',
};

export function getCategoryVisual(categoryName: string): CategoryVisual {
  return CATEGORY_VISUALS[categoryName] ?? FALLBACK_VISUAL;
}

export function getSkillEmoji(categoryName: string, skillName: string): string {
  const normalized = skillName.toLowerCase().replace(/\s+/g, ' ').trim().replace(/\s/g, '');
  const direct = SKILL_EMOJI[normalized];
  if (direct) return direct;
  const withSpace = skillName.toLowerCase().trim();
  const spaced = SKILL_EMOJI[withSpace];
  if (spaced) return spaced;
  return getCategoryVisual(categoryName).emoji;
}
