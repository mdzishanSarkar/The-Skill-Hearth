import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../models/db';
import { User, Skill, Category } from '../models';

const DHARKA_CENTER: [number, number] = [90.4125, 23.8103];
const DHARKA_AREAS = [
  'Mirpur', 'Dhanmondi', 'Gulshan', 'Uttara', 'Banani', 'Motijheel',
  'Mohammadpur', 'Badda', 'Khilgaon', 'Tejgaon', 'Farmgate', 'Shyamoli',
  'Lalmatia', 'Mohakhali', 'Rampura',
];
const DISTANCES_KM = [2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7.5, 9, 12, 15, 18];
const TYPES = ['teach', 'teach', 'teach', 'learn'] as const;
const FORMATS = ['in-person', 'online', 'either'] as const;
const SESSIONS = ['30min', '1hr', '2hr+'] as const;
const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const SEED_MARKER = '[map-seed]';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260807);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

function destPoint(lat: number, lng: number, distanceKm: number, bearingDeg: number): [number, number] {
  const R = 6378.1;
  const d = distanceKm / R;
  const brng = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const sinLat = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng),
  );
  const newLng =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(sinLat),
    );
  return [Number(((newLng * 180) / Math.PI).toFixed(6)), Number(((sinLat * 180) / Math.PI).toFixed(6))];
}

function clampToDistrict(lng: number, lat: number): [number, number] {
  return [
    Number(Math.min(90.55, Math.max(90.28, lng)).toFixed(6)),
    Number(Math.min(23.92, Math.max(23.62, lat)).toFixed(6)),
  ];
}

async function main(): Promise<void> {
  await connectDatabase();

  const users = await User.find({ role: { $ne: 'admin' } }).lean();
  if (users.length === 0) {
    console.log('No non-admin users found to seed. Create accounts first.');
    await disconnectDatabase();
    return;
  }

  const categories = await Category.find({ isActive: true }).lean();
  if (categories.length === 0) {
    console.log('No categories found. Run the server once so categories are seeded.');
    await disconnectDatabase();
    return;
  }

  const removed = await Skill.deleteMany({ description: new RegExp(`^${SEED_MARKER}`) });
  console.log(`Removed ${removed.deletedCount} previously seeded skills`);

  let skillsCreated = 0;

  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    const distanceKm = DISTANCES_KM[i % DISTANCES_KM.length];
    const bearing = rand() * 360;
    const [lng, lat] = clampToDistrict(...destPoint(DHARKA_CENTER[1], DHARKA_CENTER[0], distanceKm, bearing));
    const neighborhood = pick(DHARKA_AREAS);
    const availability = i % 3 === 0 ? [] : [
      { day: pick(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const),
        startTime: `${9 + Math.floor(rand() * 4)}:00`, endTime: `${13 + Math.floor(rand() * 6)}:00` },
    ];

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          status: 'active',
          showOnMap: true,
          hasCompletedOnboarding: true,
          isEmailVerified: true,
          'location.city': 'Dhaka',
          'location.neighborhood': neighborhood,
          'location.type': 'Point',
          'location.coordinates': [lng, lat],
          'location.radiusPreference': 10,
          availability,
          'stats.averageRating': i % 4 === 0 ? 0 : 4 + rand(),
          'stats.reviewCount': i % 4 === 0 ? 0 : Math.floor(rand() * 25),
        },
      }
    );

    const userCategories = categories
      .filter(() => rand() > 0.4)
      .slice(0, 2);
    if (userCategories.length === 0) userCategories.push(categories[Math.floor(rand() * categories.length)]);

    const skillCount = i % 3 === 2 ? 3 : 2;
    for (let s = 0; s < skillCount; s += 1) {
      const category = userCategories[s % userCategories.length];
      const item = category.skills?.length
        ? category.skills[Math.floor(rand() * category.skills.length)]
        : undefined;
      const skillName = item?.name || `Skill ${s + 1}`;
      const description = `${SEED_MARKER} Demo listing for map verification. ${item?.description || ''}`.trim();

      await Skill.create({
        userId: user._id,
        type: TYPES[Math.floor(rand() * TYPES.length)],
        categoryId: category._id,
        categoryName: category.name,
        skillName,
        description,
        proficiencyLevel: pick(LEVELS),
        format: pick(FORMATS),
        sessionLength: pick(SESSIONS),
        isActive: true,
        isDeleted: false,
        location: {
          city: 'Dhaka',
          neighborhood,
          type: 'Point',
          coordinates: [lng, lat],
          radiusPreference: 10,
        },
        stats: { averageRating: 0, reviewCount: 0, completedSessionCount: 0 },
        media: [],
      });
      skillsCreated += 1;
    }

    console.log(
      `Seeded ${user.email} (${user.displayName}): ${skillCount} skills @ ~${distanceKm}km from Dhaka centre [${lat}, ${lng}]`
    );
  }

  console.log(`\nDone. Created ${skillsCreated} skills for ${users.length} users.`);
  await disconnectDatabase();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
