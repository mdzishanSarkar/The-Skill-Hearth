export interface TaxonomySkill {
  name: string;
  slug: string;
  description: string;
}

export interface TaxonomyCategory {
  name: string;
  slug: string;
  icon: string;
  description: string;
  displayOrder: number;
  skills: TaxonomySkill[];
}

export const SKILL_TAXONOMY: TaxonomyCategory[] = [
  {
    name: 'Food & Cooking',
    slug: 'food-cooking',
    icon: 'utensils',
    description: 'Cooking, baking, and kitchen skills.',
    displayOrder: 1,
    skills: [
      { name: 'Baking', slug: 'baking', description: 'Breads, pastries, cakes and more.' },
      { name: 'Fermentation & Preserving', slug: 'fermentation-preserving', description: 'Sauerkraut, kimchi, pickling, jams.' },
      { name: 'Knife Skills', slug: 'knife-skills', description: 'Safe, efficient cutting and prep.' },
      { name: 'Meal Prep', slug: 'meal-prep', description: 'Plan and prep meals for the week.' },
    ],
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    icon: 'home',
    description: 'Hands-on household and garden know-how.',
    displayOrder: 2,
    skills: [
      { name: 'Basic Plumbing', slug: 'basic-plumbing', description: 'Fix a tap, unclog a drain, fit a washer.' },
      { name: 'Vegetable Gardening', slug: 'vegetable-gardening', description: 'Grow vegetables in beds, pots, or raised beds.' },
      { name: 'Composting', slug: 'composting', description: 'Turn kitchen and garden waste into soil.' },
      { name: 'Basic Electrical', slug: 'basic-electrical', description: 'Safe basics: sockets, switches, fuses.' },
    ],
  },
  {
    name: 'Textile & Craft',
    slug: 'textile-craft',
    icon: 'scissors',
    description: 'Sewing, mending, knitting, and upcycling.',
    displayOrder: 3,
    skills: [
      { name: 'Sewing & Mending', slug: 'sewing-mending', description: 'Repairs, alterations, and simple garments.' },
      { name: 'Knitting / Crochet', slug: 'knitting-crochet', description: 'Stitches, patterns, and finished projects.' },
      { name: 'Upcycling', slug: 'upcycling', description: 'Turn old things into something useful again.' },
    ],
  },
  {
    name: 'Digital Literacy',
    slug: 'digital-literacy',
    icon: 'monitor',
    description: 'Confidence with everyday technology.',
    displayOrder: 4,
    skills: [
      { name: 'Smartphone Basics', slug: 'smartphone-basics', description: 'Apps, photos, settings, and staying safe.' },
      { name: 'Email & Video Calls', slug: 'email-video-calls', description: 'Compose, attach, and call with confidence.' },
      { name: 'Online Safety', slug: 'online-safety', description: 'Spot scams, manage passwords, protect privacy.' },
    ],
  },
  {
    name: 'Languages & Communication',
    slug: 'languages-communication',
    icon: 'message',
    description: 'Practice and improve communication.',
    displayOrder: 5,
    skills: [
      { name: 'Conversational Language Practice', slug: 'conversational-language-practice', description: 'Casual speaking practice in any language.' },
      { name: 'Writing & Reading', slug: 'writing-reading', description: 'Everyday writing, reading, and clarity.' },
    ],
  },
  {
    name: 'Photography & Visual Arts',
    slug: 'photography-visual',
    icon: 'camera',
    description: 'Photography, editing, and visual creativity.',
    displayOrder: 6,
    skills: [
      { name: 'Photography', slug: 'photography', description: 'Composition, light, and shooting with confidence.' },
      { name: 'Photo Editing', slug: 'photo-editing', description: 'Retouching, color, and organizing your shots.' },
    ],
  },
  {
    name: 'Technology & Web',
    slug: 'technology-web',
    icon: 'code',
    description: 'Coding and web development fundamentals.',
    displayOrder: 7,
    skills: [
      { name: 'JavaScript / Web Development', slug: 'javascript-web', description: 'From variables to interactive web pages.' },
      { name: 'Intro to Programming', slug: 'intro-programming', description: 'First steps in thinking like a developer.' },
    ],
  },
  {
    name: 'Music & Performing Arts',
    slug: 'music-arts',
    icon: 'music',
    description: 'Instruments, vocals, and performance skills.',
    displayOrder: 8,
    skills: [
      { name: 'Guitar', slug: 'guitar', description: 'Chords, strumming, and your first songs.' },
      { name: 'Singing', slug: 'singing', description: 'Breath control and finding your range.' },
    ],
  },
];
