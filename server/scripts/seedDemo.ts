import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Category, Skill, User } from '../src/models';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillshare-local';
const DEMO_PASSWORD = 'Demo1234!';

interface DemoUserInput {
  email: string;
  displayName: string;
  bio: string;
  city: string;
  neighborhood: string;
  coords: [number, number];
  availability: { day: string; startTime: string; endTime: string }[];
  skills: { name: string; type: 'teach' | 'learn'; category: string; description: string; format: 'in-person' | 'online' | 'either'; proficiency: 'beginner' | 'intermediate' | 'advanced'; sessionLength: '30min' | '1hr' | '2hr+' }[];
}

const DEMO_USERS: DemoUserInput[] = [
  {
    email: 'partoftech150@gmail.com',
    displayName: 'Kabir Hasan',
    bio: 'Home cook and gardening enthusiast. Happy to share what I know.',
    city: 'Dhaka',
    neighborhood: 'Gulshan',
    coords: [90.4135, 23.7933],
    availability: [
      { day: 'saturday', startTime: '09:00', endTime: '12:00' },
      { day: 'thursday', startTime: '16:00', endTime: '19:00' },
    ],
    skills: [
      {
        name: 'Baking Basics',
        type: 'teach',
        category: 'Food & Cooking',
        description: 'Learn to bake bread, cakes and pastries from scratch at home.',
        format: 'in-person',
        proficiency: 'intermediate',
        sessionLength: '2hr+',
      },
      {
        name: 'Smartphone Basics',
        type: 'teach',
        category: 'Digital Literacy',
        description: 'Confident with calls, apps, photos and online safety on any phone.',
        format: 'either',
        proficiency: 'advanced',
        sessionLength: '1hr',
      },
    ],
  },
  {
    email: 'rahim.demo@gmail.com',
    displayName: 'Rahim Uddin',
    bio: 'Retired plumber who loves fixing things around the house.',
    city: 'Dhaka',
    neighborhood: 'Mirpur',
    coords: [90.3715, 23.8064],
    availability: [
      { day: 'sunday', startTime: '10:00', endTime: '14:00' },
      { day: 'tuesday', startTime: '10:00', endTime: '14:00' },
    ],
    skills: [
      {
        name: 'Basic Plumbing',
        type: 'teach',
        category: 'Home & Garden',
        description: 'Fix leaks, unblock drains and maintain your home plumbing.',
        format: 'in-person',
        proficiency: 'advanced',
        sessionLength: '2hr+',
      },
      {
        name: 'English Conversation',
        type: 'learn',
        category: 'Languages & Communication',
        description: 'Looking for a patient partner to practice everyday English with.',
        format: 'online',
        proficiency: 'beginner',
        sessionLength: '1hr',
      },
    ],
  },
  {
    email: 'fatima.demo@gmail.com',
    displayName: 'Fatima Begum',
    bio: 'Tailor and gardener. I upcycle old clothes into new favourites.',
    city: 'Dhaka',
    neighborhood: 'Dhanmondi',
    coords: [90.3766, 23.7463],
    availability: [
      { day: 'monday', startTime: '15:00', endTime: '18:00' },
      { day: 'wednesday', startTime: '15:00', endTime: '18:00' },
    ],
    skills: [
      {
        name: 'Sewing & Mending',
        type: 'teach',
        category: 'Textile & Craft',
        description: 'Hand and machine sewing, mending holes, and simple alterations.',
        format: 'in-person',
        proficiency: 'intermediate',
        sessionLength: '2hr+',
      },
      {
        name: 'Vegetable Gardening',
        type: 'teach',
        category: 'Home & Garden',
        description: 'Grow tomatoes, chillies and greens in pots on a balcony or roof.',
        format: 'in-person',
        proficiency: 'intermediate',
        sessionLength: '1hr',
      },
    ],
  },
  {
    email: 'sarah.johnson@example.com',
    displayName: 'sarah_teaches',
    bio: 'Knitter and crochet artist from Brooklyn.',
    city: 'New York',
    neighborhood: 'Brooklyn',
    coords: [-73.9857, 40.7484],
    availability: [
      { day: 'friday', startTime: '11:00', endTime: '14:00' },
    ],
    skills: [
      {
        name: 'Knitting / Crochet',
        type: 'teach',
        category: 'Textile & Craft',
        description: 'Beginner to intermediate knitting and crochet, from scarves to blankets.',
        format: 'in-person',
        proficiency: 'intermediate',
        sessionLength: '1hr',
      },
    ],
  },
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to', MONGODB_URI);

  const categories = await Category.find({ isActive: true }).lean();
  const categoryByName = new Map(categories.map((category) => [category.name, category]));

  for (const demo of DEMO_USERS) {
    const existing = await User.findOne({ email: demo.email });
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    const user = await User.findOneAndUpdate(
      { email: demo.email },
      {
        $set: {
          displayName: demo.displayName,
          bio: demo.bio,
          status: 'active',
          isEmailVerified: true,
          showOnMap: true,
          location: {
            city: demo.city,
            neighborhood: demo.neighborhood,
            type: 'Point',
            coordinates: demo.coords,
            radiusPreference: 5,
          },
          availability: demo.availability,
          lastActive: new Date(),
        },
        $setOnInsert: {
          passwordHash,
          role: 'user',
          stats: { sessionsCompleted: 0, averageRating: 0, reviewCount: 0 },
        },
      },
      { returnDocument: 'after', upsert: true }
    );

    if (existing) {
      console.log(`  updated user: ${demo.displayName} (${demo.email})`);
    } else {
      console.log(`  created user: ${demo.displayName} (${demo.email})`);
    }

    for (const skillInput of demo.skills) {
      const category = categoryByName.get(skillInput.category);
      if (!category) {
        console.log(`  !! category not found: ${skillInput.category}`);
        continue;
      }
      await Skill.findOneAndUpdate(
        { userId: user._id, skillName: skillInput.name, isDeleted: false },
        {
          $set: {
            type: skillInput.type,
            categoryId: category._id,
            categoryName: category.name,
            description: skillInput.description,
            format: skillInput.format,
            proficiencyLevel: skillInput.proficiency,
            sessionLength: skillInput.sessionLength,
            isActive: true,
            location: {
              city: demo.city,
              neighborhood: demo.neighborhood,
              type: 'Point',
              coordinates: demo.coords,
              radiusPreference: 5,
            },
          },
          $setOnInsert: {
            stats: { averageRating: 0, reviewCount: 0, completedSessionCount: 0 },
            media: [],
            isPromoted: false,
          },
        },
        { upsert: true }
      );
      console.log(`  skill ready: ${skillInput.name} (${skillInput.type})`);
    }
  }

  await mongoose.disconnect();
  console.log('Demo data ready.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
