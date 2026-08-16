import 'dotenv/config';
import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../models/db';
import { seedCategories } from '../services/skill';
import { getDirectMessageRoomId } from '../services/friendship';
import { getLevelForXp } from '../services/gamification';
import {
  User,
  Skill,
  Category,
  Connection,
  Message,
  Review,
  Report,
  Notification,
  TokenBlacklist,
  Block,
  SkillSwap,
  GroupSession,
  SavedSearch,
  CommunityPost,
  Endorsement,
  AuditLog,
  PasswordResetToken,
  EmailVerificationToken,
  RefreshToken,
  OAuthProvider,
  TwoFactorSecret,
  SkillSuggestion,
  SkillBundle,
  BlockOutDate,
  LearnerRequest,
  SessionNote,
  Tip,
  Course,
  CourseEnrollment,
  Challenge,
  Mentorship,
  Showcase,
  Webhook,
  ApiKey,
  CalendarIntegration,
  BotInstallation,
  Friendship,
  ActivityEvent,
  Streak,
  DirectMessage,
  SkillJournal,
  RequestTemplate,
} from '../models';

const PASSWORD = 'Demo1234!';
const H = 3600 * 1000;
const D = 24 * H;
const daysAgo = (n: number) => new Date(Date.now() - n * D);
const daysFromNow = (n: number) => new Date(Date.now() + n * D);
const OID = () => new Types.ObjectId();

async function clearAll(): Promise<void> {
  const collections = [
    'users', 'skills', 'categories', 'connections', 'messages', 'reviews', 'reports',
    'notifications', 'tokenblacklists', 'blocks', 'skillswaps', 'groupsessions',
    'savedsearches', 'communityposts', 'endorsements', 'auditlogs',
    'passwordresettokens', 'emailverificationtokens', 'refreshtokens', 'oauthproviders',
    'twofactorsecrets', 'skillsuggestions', 'skillbundles', 'blockoutdates',
    'learnerrequests', 'sessionnotes', 'tips', 'courses', 'courseenrollments',
    'challenges', 'mentorships', 'showcases', 'webhooks', 'apikeys',
    'calendarintegrations', 'botinstallations', 'friendships', 'activityevents',
    'streaks', 'directmessages', 'skilljournals', 'requesttemplates',
  ];
  for (const name of collections) {
    const { deletedCount } = await require('mongoose').connection.collection(name).deleteMany({});
    console.log(`  cleared ${name} (${deletedCount})`);
  }
}

async function main(): Promise<void> {
  await connectDatabase();
  console.log('\n== Clearing existing data ==');
  await clearAll();

  console.log('\n== Seeding categories ==');
  await seedCategories();
  const categories = await Category.find({ isActive: true }).lean();
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));

  console.log('\n== Seeding users ==');
  const U: Record<string, Types.ObjectId> = {};
  const userIds = [
    'admin', 'moderator', 'demo', 'maria', 'kabir', 'rahim', 'fatima', 'noah',
    'ayesha', 'james', 'spam', 'banned', 'shadow', 'unverified', 'pro', 'offline',
    'nyc', 'london', 'gen1', 'gen2', 'gen3', 'gen4', 'gen5', 'gen6', 'gen7',
    'gen8', 'gen9', 'gen10', 'gen11', 'gen12', 'gen13', 'gen14', 'gen15',
  ];
  userIds.forEach((key) => { U[key] = OID(); });

  const coords = {
    dhaka: [90.4125, 23.8103] as [number, number],
    gulshan: [90.4135, 23.7933] as [number, number],
    mirpur: [90.3715, 23.8064] as [number, number],
    dhanmondi: [90.375, 23.7461] as [number, number],
    banani: [90.4092, 23.785] as [number, number],
    uttara: [90.3643, 23.8757] as [number, number],
    mohammadpur: [90.3606, 23.7648] as [number, number],
    brooklyn: [-73.9442, 40.6782] as [number, number],
    camden: [-0.1459, 51.5413] as [number, number],
    pro: [90.406, 23.798] as [number, number],
    gen1: [90.395, 23.815] as [number, number],
    gen2: [90.405, 23.805] as [number, number],
    gen3: [90.42, 23.79] as [number, number],
    gen4: [90.385, 23.82] as [number, number],
    gen5: [90.43, 23.775] as [number, number],
    gen6: [90.375, 23.83] as [number, number],
    gen7: [90.415, 23.77] as [number, number],
    gen8: [90.392, 23.812] as [number, number],
    gen9: [90.41, 23.8] as [number, number],
    gen10: [90.398, 23.8] as [number, number],
    gen11: [90.422, 23.785] as [number, number],
    gen12: [90.38, 23.815] as [number, number],
    gen13: [90.425, 23.8] as [number, number],
    gen14: [90.388, 23.795] as [number, number],
    gen15: [90.4, 23.82] as [number, number],
  };

  interface UInput {
    key: string;
    email: string;
    displayName: string;
    username: string;
    role?: 'user' | 'admin' | 'moderator';
    status?: 'active' | 'suspended' | 'banned';
    city?: string;
    neighborhood?: string;
    coords?: [number, number];
    showOnMap?: boolean;
    availability?: { day: string; startTime: string; endTime: string }[];
    xp?: number;
    badges?: string[];
    quietHours?: { enabled: boolean; startTime: string; endTime: string; timezone: string };
    isEmailVerified?: boolean;
    hasCompletedOnboarding?: boolean;
    isIdVerified?: boolean;
    isShadowBanned?: boolean;
    lastActive?: Date;
    createdAt?: Date;
    referralCode?: string;
  }

  const userInputs: UInput[] = [
    { key: 'admin', email: 'admin@skillhearth.test', displayName: 'Admin Hearth', username: 'admin_hearth', role: 'admin', xp: 5000, badges: ['early_adopter', 'full_profile', 'hundred_sessions'], city: 'dhaka', neighborhood: 'gulshan', coords: coords.gulshan },
    { key: 'moderator', email: 'moderator@skillhearth.test', displayName: 'Moderator Mita', username: 'mod_mita', role: 'moderator', xp: 2400, badges: ['early_adopter', 'full_profile', 'ten_sessions'], city: 'dhaka', neighborhood: 'dhanmondi', coords: coords.dhanmondi },
    { key: 'demo', email: 'demo@skillhearth.test', displayName: 'Demo Tester', username: 'demo_tester', xp: 1250, badges: ['first_spark', 'full_profile', 'ready_to_share', 'first_session', 'five_star_debut', 'first_friend', 'ten_friends', 'skill_swapper', 'streak_7', 'streak_30', 'multi_skill', 'early_adopter', 'local_legend'], city: 'dhaka', neighborhood: 'gulshan', coords: coords.gulshan, referralCode: 'SH-DEMO42', availability: [{ day: 'monday', startTime: '09:00', endTime: '12:00' }, { day: 'saturday', startTime: '10:00', endTime: '14:00' }] },
    { key: 'maria', email: 'maria@skillhearth.test', displayName: 'Maria Ahmed', username: 'maria_ahmed', xp: 600, badges: ['first_spark', 'full_profile', 'first_session'], city: 'dhaka', neighborhood: 'gulshan', coords: coords.gulshan },
    { key: 'kabir', email: 'kabir@skillhearth.test', displayName: 'Kabir Hossain', username: 'kabir_hossain', xp: 800, badges: ['first_spark', 'full_profile', 'first_session'], city: 'dhaka', neighborhood: 'mirpur', coords: coords.mirpur },
    { key: 'rahim', email: 'rahim@skillhearth.test', displayName: 'Rahim Uddin', username: 'rahim_uddin', xp: 300, badges: ['first_spark'], city: 'dhaka', neighborhood: 'mirpur', coords: coords.mirpur },
    { key: 'fatima', email: 'fatima@skillhearth.test', displayName: 'Fatima Begum', username: 'fatima_begum', xp: 450, badges: ['first_spark', 'full_profile'], city: 'dhaka', neighborhood: 'dhanmondi', coords: coords.dhanmondi },
    { key: 'noah', email: 'noah@skillhearth.test', displayName: 'Noah Rahman', username: 'noah_rahman', xp: 200, badges: ['first_spark'], city: 'dhaka', neighborhood: 'banani', coords: coords.banani },
    { key: 'ayesha', email: 'ayesha@skillhearth.test', displayName: 'Ayesha Siddiqua', username: 'ayesha_siddiqua', xp: 120, city: 'dhaka', neighborhood: 'uttara', coords: coords.uttara },
    { key: 'james', email: 'james@skillhearth.test', displayName: 'James Wilson', username: 'james_wilson', xp: 80, city: 'dhaka', neighborhood: 'mohammadpur', coords: coords.mohammadpur },
    { key: 'spam', email: 'spam@skillhearth.test', displayName: 'Spam Account', username: 'spam_account', status: 'suspended', xp: 0, city: 'dhaka', neighborhood: 'mirpur', coords: coords.mirpur },
    { key: 'banned', email: 'banned@skillhearth.test', displayName: 'Banned User', username: 'banned_user', status: 'banned', xp: 0, city: 'dhaka', neighborhood: 'dhanmondi', coords: coords.dhanmondi },
    { key: 'shadow', email: 'shadow@skillhearth.test', displayName: 'Shadow User', username: 'shadow_user', isShadowBanned: true, xp: 60, city: 'dhaka', neighborhood: 'banani', coords: coords.banani },
    { key: 'unverified', email: 'unverified@skillhearth.test', displayName: 'Unverified User', username: 'unverified_user', isEmailVerified: false, hasCompletedOnboarding: false, xp: 20, city: 'dhaka', neighborhood: 'gulshan', coords: coords.gulshan },
    { key: 'pro', email: 'pro@skillhearth.test', displayName: 'Pro User', username: 'pro_user', xp: 900, badges: ['first_spark', 'full_profile', 'first_session', 'ten_sessions'], city: 'dhaka', neighborhood: 'banani', coords: coords.pro },
    { key: 'offline', email: 'offline@skillhearth.test', displayName: 'Offline User', username: 'offline_user', xp: 150, quietHours: { enabled: true, startTime: '22:00', endTime: '07:00', timezone: 'Asia/Dhaka' }, lastActive: daysAgo(9), city: 'dhaka', neighborhood: 'gulshan', coords: coords.gulshan },
    { key: 'nyc', email: 'nyc@skillhearth.test', displayName: 'NYC Sarah', username: 'nyc_sarah', xp: 500, badges: ['first_spark', 'full_profile'], city: 'new york', neighborhood: 'brooklyn', coords: coords.brooklyn },
    { key: 'london', email: 'london@skillhearth.test', displayName: 'London Paul', username: 'london_paul', xp: 300, city: 'london', neighborhood: 'camden', coords: coords.camden },
  ];

  for (let i = 1; i <= 15; i += 1) {
    const genKey = `gen${i}`;
    userInputs.push({
      key: genKey,
      email: `${genKey}@skillhearth.test`,
      displayName: `Gen ${i} User`,
      username: `gen_user_${i}`,
      xp: i * 25,
      badges: i % 2 === 0 ? ['first_spark'] : [],
      city: 'dhaka',
      neighborhood: i % 2 === 0 ? 'uttara' : 'banani',
      coords: coords[genKey as keyof typeof coords] as [number, number],
      lastActive: i === 1 ? daysAgo(2) : i === 2 ? daysAgo(1) : daysAgo(0),
    });
  }

  const friendMap: Record<string, Types.ObjectId[]> = {
    demo: [U.maria, U.kabir, U.rahim, U.fatima, U.noah],
    maria: [U.demo, U.kabir],
    kabir: [U.demo, U.maria, U.rahim],
    rahim: [U.demo, U.kabir],
    fatima: [U.demo],
    noah: [U.demo],
    gen1: [U.gen2],
    gen2: [U.gen1],
  };
  const closeFriendMap: Record<string, Types.ObjectId[]> = {
    demo: [U.maria],
    maria: [U.demo],
  };

  for (const input of userInputs) {
    const userId = U[input.key];
    const level = getLevelForXp(input.xp ?? 0);
    await User.create({
      _id: userId,
      email: input.email,
      passwordHash: PASSWORD,
      username: input.username,
      displayName: input.displayName,
      bio: `${input.displayName} - seeded test account on Skill Hearth.`,
      role: input.role ?? 'user',
      status: input.status ?? 'active',
      suspensionExpiresAt: input.status === 'suspended' ? daysFromNow(14) : undefined,
      location: {
        city: input.city ?? 'dhaka',
        zipCode: '1207',
        neighborhood: input.neighborhood ?? '',
        type: 'Point',
        coordinates: input.coords ?? coords.dhaka,
        radiusPreference: 5,
      },
      showOnMap: input.showOnMap ?? true,
      availability: input.availability ?? [],
      stats: { sessionsCompleted: 0, averageRating: 0, reviewCount: 0 },
      gamification: {
        xp: input.xp ?? 0,
        level: level.level,
        badges: input.badges ?? [],
        streakFreezeAvailable: 2,
        referralCode: input.referralCode ?? '',
        referredBy: undefined,
        lastXPAction: undefined,
      },
      friendIds: friendMap[input.key] ?? [],
      closeFriendIds: closeFriendMap[input.key] ?? [],
      feedVisibility: 'friends',
      mapPreferences: { defaultMode: 'auto', defaultView: 'map', clusterMarkers: true },
      quietHours: input.quietHours ?? { enabled: false, startTime: '22:00', endTime: '07:00', timezone: '' },
      isEmailVerified: input.isEmailVerified ?? true,
      hasCompletedOnboarding: input.hasCompletedOnboarding ?? true,
      isIdVerified: input.isIdVerified ?? false,
      isShadowBanned: input.isShadowBanned ?? false,
      lastActive: input.lastActive ?? daysAgo(0),
      createdAt: input.createdAt ?? daysAgo(Math.max(1, Math.floor((input.xp ?? 0) / 60))),
    });
    console.log(`  user: ${input.email}`);
  }

  console.log('\n== Seeding skills ==');
  const S: Record<string, Types.ObjectId> = {};
  const skillDefs = [
    { key: 'DEMO_BAKE', user: 'demo', type: 'teach', cat: 'food-cooking', name: 'Baking Basics', desc: 'Learn to bake bread, cakes and pastries from scratch at home.', prof: 'intermediate', format: 'in-person', len: '2hr+', city: 'dhaka', nbhd: 'gulshan', coords: coords.gulshan, media: 2, stats: { averageRating: 4.8, reviewCount: 6, completedSessionCount: 10 }, promoted: true },
    { key: 'DEMO_PHONE', user: 'demo', type: 'teach', cat: 'digital-literacy', name: 'Smartphone Basics', desc: 'Confident with calls, apps, photos and online safety on any phone.', prof: 'advanced', format: 'either', len: '1hr', city: 'dhaka', nbhd: 'gulshan', coords: coords.gulshan, stats: { averageRating: 4.5, reviewCount: 3, completedSessionCount: 6 } },
    { key: 'DEMO_GARDEN', user: 'demo', type: 'teach', cat: 'home-garden', name: 'Vegetable Gardening', desc: 'Grow tomatoes, chillies and greens in pots on a balcony or roof.', prof: 'intermediate', format: 'in-person', len: '1hr', city: 'dhaka', nbhd: 'gulshan', coords: coords.gulshan, stats: { averageRating: 5, reviewCount: 2, completedSessionCount: 5 } },
    { key: 'DEMO_KNIT_LEARN', user: 'demo', type: 'learn', cat: 'textile-craft', name: 'Knitting / Crochet', desc: 'I want to learn knitting and crochet from scratch.', prof: 'beginner', format: 'either', len: '1hr', city: 'dhaka', nbhd: 'gulshan', coords: coords.gulshan },
    { key: 'DEMO_ENGLISH_LEARN', user: 'demo', type: 'learn', cat: 'languages-communication', name: 'Conversational Language Practice', desc: 'Looking for a patient partner to practice everyday English with.', prof: 'beginner', format: 'online', len: '1hr', city: 'dhaka', nbhd: 'gulshan', coords: coords.gulshan },
    { key: 'DEMO_PLUMB_LEARN', user: 'demo', type: 'learn', cat: 'home-garden', name: 'Basic Plumbing', desc: 'I want to learn basic home plumbing maintenance.', prof: 'beginner', format: 'in-person', len: '2hr+', city: 'dhaka', nbhd: 'gulshan', coords: coords.gulshan },
    { key: 'DEMO_HIDDEN', user: 'demo', type: 'teach', cat: 'food-cooking', name: 'Hidden Bread Course', desc: 'Inactive hidden skill for testing.', prof: 'advanced', format: 'online', len: '1hr', city: 'dhaka', nbhd: 'gulshan', coords: coords.gulshan, isActive: false },
    { key: 'DEMO_DELETED', user: 'demo', type: 'teach', cat: 'food-cooking', name: 'Deleted Candle Making', desc: 'Soft-deleted skill for testing.', prof: 'beginner', format: 'online', len: '1hr', city: 'dhaka', nbhd: 'gulshan', coords: coords.gulshan, isDeleted: true },
    { key: 'MARIA_SEW', user: 'maria', type: 'teach', cat: 'textile-craft', name: 'Sewing & Mending', desc: 'Hand and machine sewing, mending holes and simple alterations.', prof: 'intermediate', format: 'in-person', len: '2hr+', city: 'dhaka', nbhd: 'gulshan', coords: coords.gulshan, stats: { averageRating: 4.5, reviewCount: 2, completedSessionCount: 4 } },
    { key: 'KABIR_BAKE', user: 'kabir', type: 'teach', cat: 'food-cooking', name: 'Baking', desc: 'Sourdough, baguettes and enriched breads.', prof: 'advanced', format: 'in-person', len: '2hr+', city: 'dhaka', nbhd: 'mirpur', coords: coords.mirpur, stats: { averageRating: 5, reviewCount: 3, completedSessionCount: 7 } },
    { key: 'KABIR_KNIT_LEARN', user: 'kabir', type: 'learn', cat: 'textile-craft', name: 'Knitting / Crochet', desc: 'Want to learn knitting.', prof: 'beginner', format: 'online', len: '1hr', city: 'dhaka', nbhd: 'mirpur', coords: coords.mirpur },
    { key: 'RAHIM_PLUMB', user: 'rahim', type: 'teach', cat: 'home-garden', name: 'Basic Plumbing', desc: 'Fix leaks, unblock drains and maintain home plumbing.', prof: 'advanced', format: 'in-person', len: '2hr+', city: 'dhaka', nbhd: 'mirpur', coords: coords.mirpur, stats: { averageRating: 4.2, reviewCount: 4, completedSessionCount: 9 } },
    { key: 'FATIMA_UP', user: 'fatima', type: 'teach', cat: 'textile-craft', name: 'Upcycling', desc: 'Turn old clothes into new favourites.', prof: 'intermediate', format: 'in-person', len: '2hr+', city: 'dhaka', nbhd: 'dhanmondi', coords: coords.dhanmondi },
    { key: 'FATIMA_GARDEN_LEARN', user: 'fatima', type: 'learn', cat: 'home-garden', name: 'Vegetable Gardening', desc: 'Want to grow balcony veggies.', prof: 'beginner', format: 'in-person', len: '1hr', city: 'dhaka', nbhd: 'dhanmondi', coords: coords.dhanmondi },
    { key: 'NOAH_COMPOST', user: 'noah', type: 'teach', cat: 'home-garden', name: 'Composting', desc: 'Turn kitchen waste into rich soil.', prof: 'beginner', format: 'in-person', len: '1hr', city: 'dhaka', nbhd: 'banani', coords: coords.banani },
    { key: 'AYESHA_EMAIL', user: 'ayesha', type: 'teach', cat: 'digital-literacy', name: 'Email & Video Calls', desc: 'Compose, attach and call with confidence.', prof: 'intermediate', format: 'online', len: '1hr', city: 'dhaka', nbhd: 'uttara', coords: coords.uttara },
    { key: 'JAMES_WRITE', user: 'james', type: 'teach', cat: 'languages-communication', name: 'Writing & Reading', desc: 'Everyday writing, reading and clarity.', prof: 'intermediate', format: 'online', len: '1hr', city: 'dhaka', nbhd: 'mohammadpur', coords: coords.mohammadpur },
    { key: 'PRO_MEAL', user: 'pro', type: 'teach', cat: 'food-cooking', name: 'Meal Prep', desc: 'Plan and prep meals for the week.', prof: 'advanced', format: 'online', len: '1hr', city: 'dhaka', nbhd: 'banani', coords: coords.pro },
    { key: 'OFFLINE_PHONE', user: 'offline', type: 'teach', cat: 'digital-literacy', name: 'Smartphone Basics', desc: 'Offline user skill.', prof: 'beginner', format: 'online', len: '1hr', city: 'dhaka', nbhd: 'gulshan', coords: coords.gulshan },
    { key: 'NYC_KNIT', user: 'nyc', type: 'teach', cat: 'textile-craft', name: 'Knitting / Crochet', desc: 'Beginner to intermediate knitting and crochet.', prof: 'intermediate', format: 'in-person', len: '1hr', city: 'new york', nbhd: 'brooklyn', coords: coords.brooklyn },
    { key: 'LONDON_GARDEN', user: 'london', type: 'teach', cat: 'home-garden', name: 'Vegetable Gardening', desc: 'Allotment and container growing in London.', prof: 'intermediate', format: 'in-person', len: '1hr', city: 'london', nbhd: 'camden', coords: coords.camden },
    { key: 'SHADOW_PHONE', user: 'shadow', type: 'teach', cat: 'digital-literacy', name: 'Smartphone Basics', desc: 'Shadow banned user skill.', prof: 'beginner', format: 'online', len: '1hr', city: 'dhaka', nbhd: 'banani', coords: coords.banani },
    { key: 'SPAM_GETRICH', user: 'spam', type: 'teach', cat: 'digital-literacy', name: 'Get Rich Quick', desc: 'Buy my course, 100% guaranteed money!!', prof: 'beginner', format: 'online', len: '1hr', city: 'dhaka', nbhd: 'mirpur', coords: coords.mirpur },
    { key: 'BANNED_COOK', user: 'banned', type: 'teach', cat: 'food-cooking', name: 'Meal Prep', desc: 'Banned user skill.', prof: 'beginner', format: 'online', len: '1hr', city: 'dhaka', nbhd: 'dhanmondi', coords: coords.dhanmondi },
  ];

  for (const def of skillDefs as any[]) {
    const id = OID();
    S[def.key] = id;
    const cat = catBySlug.get(def.cat);
    if (!cat) {
      console.log(`  !! missing category ${def.cat}`);
      continue;
    }
    const media = def.media
      ? Array.from({ length: def.media }, (_, i) => ({
          url: `https://res.cloudinary.com/demo/image/upload/v1/skills/${def.key}_${i}.jpg`,
          publicId: `${def.key}_${i}`,
        }))
      : [];
    await Skill.create({
      _id: id,
      userId: U[def.user],
      type: def.type,
      categoryId: cat._id,
      categoryName: cat.name,
      skillName: def.name,
      description: def.desc,
      proficiencyLevel: def.prof,
      format: def.format,
      sessionLength: def.len,
      isActive: def.isActive ?? true,
      isDeleted: def.isDeleted ?? false,
      deletedAt: def.isDeleted ? daysAgo(5) : undefined,
      isPromoted: def.promoted ?? false,
      promotionExpiresAt: def.promoted ? daysFromNow(7) : undefined,
      media,
      location: { city: def.city, zipCode: '1207', neighborhood: def.nbhd, type: 'Point', coordinates: def.coords, radiusPreference: 5 },
      stats: def.stats ?? { averageRating: 0, reviewCount: 0, completedSessionCount: 0 },
    });
    console.log(`  skill: ${def.key}`);
  }

  for (let i = 1; i <= 15; i += 1) {
    const catKeys = ['food-cooking', 'home-garden', 'textile-craft', 'digital-literacy', 'languages-communication'];
    const cat = catBySlug.get(catKeys[i % catKeys.length])!;
    const key = `GEN${i}_SKILL`;
    S[key] = OID();
    await Skill.create({
      _id: S[key],
      userId: U[`gen${i}`],
      type: i % 3 === 0 ? 'learn' : 'teach',
      categoryId: cat._id,
      categoryName: cat.name,
      skillName: cat.skills[Math.floor(i / catKeys.length) % cat.skills.length]?.name ?? 'General Skill',
      description: `Generated skill for gen${i}.`,
      proficiencyLevel: (['beginner', 'intermediate', 'advanced'] as const)[i % 3],
      format: (['in-person', 'online', 'either'] as const)[i % 3],
      sessionLength: (['30min', '1hr', '2hr+'] as const)[i % 3],
      isActive: true,
      isDeleted: false,
      media: [],
      location: { city: 'dhaka', zipCode: '1207', neighborhood: i % 2 === 0 ? 'uttara' : 'banani', type: 'Point', coordinates: coords[`gen${i}` as keyof typeof coords] as [number, number], radiusPreference: 5 },
      stats: { averageRating: 0, reviewCount: 0, completedSessionCount: 0 },
    });
  }

  console.log('\n== Seeding connections ==');
  const C: Record<string, Types.ObjectId> = {};
  const connInputs: any[] = [
    { key: 'C1', requester: 'maria', teacher: 'demo', skill: 'DEMO_PHONE', status: 'pending', message: 'Hi! I would love to learn how to use my phone camera better. Are you available Saturdays?', proposedFormat: 'in-person' },
    { key: 'C2', requester: 'kabir', teacher: 'demo', skill: 'DEMO_BAKE', status: 'accepted', message: 'Could you teach me a proper sourdough?', responseMessage: 'Of course! How about Sunday morning?', proposedFormat: 'in-person' },
    { key: 'C3', requester: 'rahim', teacher: 'demo', skill: 'DEMO_BAKE', status: 'rejected', message: 'Interested in your bread class.', responseMessage: 'Sorry, I am booked this month.', proposedFormat: 'either' },
    { key: 'C4', requester: 'fatima', teacher: 'demo', skill: 'DEMO_GARDEN', status: 'completed', message: 'Help me set up balcony containers?', completedAt: daysAgo(20), proposedFormat: 'in-person' },
    { key: 'C5', requester: 'noah', teacher: 'demo', skill: 'DEMO_PHONE', status: 'cancelled', message: 'Phone help please.', cancelledBy: U.noah, cancellationReason: 'Found another teacher', proposedFormat: 'online' },
    { key: 'C6', requester: 'gen1', teacher: 'demo', skill: 'DEMO_BAKE', status: 'completed', message: 'Want to learn bread basics.', completedAt: daysAgo(1), proposedFormat: 'in-person' },
    { key: 'C7', requester: 'gen2', teacher: 'demo', skill: 'DEMO_PHONE', status: 'completed', message: 'Need help with apps.', completedAt: daysAgo(2), proposedFormat: 'online' },
    { key: 'C8', requester: 'gen3', teacher: 'demo', skill: 'DEMO_GARDEN', status: 'completed', message: 'Gardening on my roof.', completedAt: daysAgo(3), proposedFormat: 'in-person' },
    { key: 'C9', requester: 'gen4', teacher: 'demo', skill: 'DEMO_BAKE', status: 'completed', message: 'Sourdough starter help.', completedAt: daysAgo(6), proposedFormat: 'in-person' },
    { key: 'C10', requester: 'gen5', teacher: 'demo', skill: 'DEMO_PHONE', status: 'completed', message: 'Photos and settings.', completedAt: daysAgo(8), proposedFormat: 'online' },
    { key: 'C11', requester: 'gen6', teacher: 'demo', skill: 'DEMO_BAKE', status: 'withdrawn', message: 'Bread help.', proposedFormat: 'either' },
    { key: 'C12', requester: 'gen7', teacher: 'demo', skill: 'DEMO_GARDEN', status: 'completed', message: 'Companion planting.', completedAt: daysAgo(25), proposedFormat: 'in-person' },
    { key: 'C13', requester: 'ayesha', teacher: 'demo', skill: 'DEMO_BAKE', status: 'pending', message: 'Fresh to the platform, love bread!', proposedFormat: 'in-person' },
    { key: 'C14', requester: 'demo', teacher: 'kabir', skill: 'KABIR_BAKE', status: 'accepted', message: 'Teach me your sourdough technique?', responseMessage: 'Happy to! Bring your starter.', proposedFormat: 'in-person' },
    { key: 'C15', requester: 'demo', teacher: 'maria', skill: 'MARIA_SEW', status: 'pending', message: 'I would like to learn mending basics.', proposedFormat: 'in-person' },
    { key: 'C16', requester: 'demo', teacher: 'rahim', skill: 'RAHIM_PLUMB', status: 'completed', message: 'Fix a dripping tap with me?', completedAt: daysAgo(1), proposedFormat: 'in-person' },
    { key: 'C17', requester: 'demo', teacher: 'noah', skill: 'NOAH_COMPOST', status: 'completed', message: 'Help me start a compost bin.', completedAt: daysAgo(2), proposedFormat: 'in-person' },
    { key: 'C18', requester: 'demo', teacher: 'fatima', skill: 'FATIMA_UP', status: 'completed', message: 'Upcycle an old shirt with me.', completedAt: daysAgo(4), proposedFormat: 'in-person' },
    { key: 'C19', requester: 'demo', teacher: 'pro', skill: 'PRO_MEAL', status: 'completed', message: 'Weekly meal prep planning.', completedAt: daysAgo(9), proposedFormat: 'online' },
    { key: 'C20', requester: 'demo', teacher: 'gen8', skill: 'GEN8_SKILL', status: 'rejected', message: 'Interested.', responseMessage: 'Sorry, too busy.', proposedFormat: 'online' },
    { key: 'C21', requester: 'demo', teacher: 'gen9', skill: 'GEN9_SKILL', status: 'completed', message: 'Session please.', completedAt: daysAgo(5), proposedFormat: 'online' },
    { key: 'C22', requester: 'demo', teacher: 'gen10', skill: 'GEN10_SKILL', status: 'cancelled', message: 'Let us try.', cancelledBy: U.demo, cancellationReason: 'Scheduling conflict', proposedFormat: 'online' },
    { key: 'C23', requester: 'demo', teacher: 'gen11', skill: 'GEN11_SKILL', status: 'completed', message: 'Help me learn.', completedAt: daysAgo(12), proposedFormat: 'online' },
    { key: 'C24', requester: 'demo', teacher: 'gen12', skill: 'GEN12_SKILL', status: 'completed', message: 'Please teach me.', completedAt: daysAgo(30), proposedFormat: 'online' },
    { key: 'C25', requester: 'demo', teacher: 'gen13', skill: 'GEN13_SKILL', status: 'withdrawn', message: 'On second thought.', proposedFormat: 'online' },
    { key: 'C26', requester: 'demo', teacher: 'gen14', skill: 'GEN14_SKILL', status: 'accepted', message: 'Let us connect.', proposedFormat: 'online' },
    { key: 'C27', requester: 'demo', teacher: 'gen15', skill: 'GEN15_SKILL', status: 'completed', message: 'Final test session.', completedAt: daysAgo(3), proposedFormat: 'online' },
    { key: 'C28', requester: 'gen1', teacher: 'gen2', skill: 'GEN2_SKILL', status: 'completed', message: 'Swap practice.', completedAt: daysAgo(5), proposedFormat: 'online' },
    { key: 'C29', requester: 'maria', teacher: 'kabir', skill: 'KABIR_BAKE', status: 'completed', message: 'Learn baguettes.', completedAt: daysAgo(7), proposedFormat: 'in-person' },
    { key: 'C30', requester: 'ayesha', teacher: 'demo', skill: 'DEMO_PHONE', status: 'completed', message: 'Video calls help.', completedAt: daysAgo(15), proposedFormat: 'online' },
    { key: 'C31', requester: 'demo', teacher: 'gen1', skill: 'GEN1_SKILL', status: 'completed', message: 'Learn from you.', completedAt: daysAgo(10), proposedFormat: 'online' },
    { key: 'C32', requester: 'demo', teacher: 'gen2', skill: 'GEN2_SKILL', status: 'completed', message: 'Teach me yours.', completedAt: daysAgo(11), proposedFormat: 'online' },
    { key: 'C33', requester: 'demo', teacher: 'gen3', skill: 'GEN3_SKILL', status: 'completed', message: 'Another session.', completedAt: daysAgo(12), proposedFormat: 'online' },
  ];

  for (const input of connInputs) {
    C[input.key] = OID();
    await Connection.create({
      _id: C[input.key],
      requesterId: U[input.requester],
      teacherId: U[input.teacher],
      skillId: S[input.skill],
      status: input.status,
      message: input.message,
      responseMessage: input.responseMessage,
      proposedFormat: input.proposedFormat,
      completedAt: input.completedAt,
      cancelledBy: input.cancelledBy,
      cancellationReason: input.cancellationReason,
      createdAt: input.completedAt ?? daysAgo(Math.floor(Math.random() * 10)),
    });
    console.log(`  connection: ${input.key}`);
  }

  console.log('\n== Seeding messages ==');
  const M: Record<string, Types.ObjectId> = {};
  const msgInputs: any[] = [
    { key: 'M1', conn: 'C2', sender: 'kabir', content: 'Thanks again for agreeing!', readAt: daysAgo(1), deliveredAt: daysAgo(1) },
    { key: 'M2', conn: 'C2', sender: 'demo', content: 'Anytime! Bring a jar for the starter.', readAt: daysAgo(1), deliveredAt: daysAgo(1) },
    { key: 'M3', conn: 'C2', sender: 'kabir', content: 'This is an inappropriate spam message for reporting.', readAt: daysAgo(1), deliveredAt: daysAgo(1), isReported: true },
    { key: 'M4', conn: 'C2', sender: 'demo', content: 'Here is the recipe photo:', type: 'image', imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/msg/sourdough.jpg', imagePublicId: 'msg/sourdough', readAt: daysAgo(1), deliveredAt: daysAgo(1) },
    { key: 'M5', conn: 'C2', sender: 'demo', content: 'Session scheduled for Sunday 10am.', type: 'system', readAt: daysAgo(1), deliveredAt: daysAgo(1) },
    { key: 'M6', conn: 'C14', sender: 'demo', content: 'My starter is ready!', readAt: daysAgo(2), deliveredAt: daysAgo(2) },
    { key: 'M7', conn: 'C14', sender: 'kabir', content: 'Great, see you Thursday.', readAt: daysAgo(2), deliveredAt: daysAgo(2), reactions: [{ userId: U.demo, emoji: '👍', createdAt: daysAgo(2) }] },
    { key: 'M8', conn: 'C7', sender: 'gen2', content: 'That app lesson helped a lot!', readAt: daysAgo(2), deliveredAt: daysAgo(2) },
    { key: 'M9', conn: 'C7', sender: 'demo', content: 'Happy to hear it!', readAt: undefined, deliveredAt: daysAgo(2) },
    { key: 'M10', conn: 'C6', sender: 'gen1', content: 'Loved the bread session!', readAt: daysAgo(1), deliveredAt: daysAgo(1) },
    { key: 'M11', conn: 'C6', sender: 'demo', content: 'Come back next month!', readAt: undefined, deliveredAt: daysAgo(1) },
    { key: 'M12', conn: 'C16', sender: 'demo', content: 'The tap is fixed, thank you Rahim!', readAt: daysAgo(1), deliveredAt: daysAgo(1) },
    { key: 'M13', conn: 'C16', sender: 'rahim', content: 'Anytime!', readAt: daysAgo(1), deliveredAt: daysAgo(1), reactions: [{ userId: U.demo, emoji: '🎉', createdAt: daysAgo(1) }] },
    { key: 'M14', conn: 'C29', sender: 'kabir', content: 'Baguette class was excellent.', readAt: daysAgo(7), deliveredAt: daysAgo(7) },
    { key: 'M15', conn: 'C29', sender: 'maria', content: 'I will bring the photos!', readAt: daysAgo(7), deliveredAt: daysAgo(7) },
    { key: 'M16', conn: 'C2', sender: 'kabir', content: 'Deleted message for testing.', isDeleted: true },
  ];
  for (const input of msgInputs) {
    M[input.key] = OID();
    await Message.create({
      _id: M[input.key],
      connectionId: C[input.conn],
      senderId: U[input.sender],
      content: input.content,
      type: input.type ?? 'text',
      imageUrl: input.imageUrl,
      imagePublicId: input.imagePublicId,
      readAt: input.readAt,
      deliveredAt: input.deliveredAt,
      isReported: input.isReported ?? false,
      reactions: input.reactions ?? [],
      isDeleted: input.isDeleted ?? false,
    });
  }

  console.log('\n== Seeding reviews ==');
  const R: Record<string, Types.ObjectId> = {};
  const reviewInputs: any[] = [
    { key: 'R1', conn: 'C4', reviewer: 'fatima', reviewee: 'demo', skill: 'DEMO_GARDEN', rating: 5, content: 'Demo is a wonderful gardener and teacher!', tags: ['Patient teacher', 'Clear explanations', 'Enthusiastic'], wouldRecommend: true },
    { key: 'R2', conn: 'C9', reviewer: 'gen4', reviewee: 'demo', skill: 'DEMO_BAKE', rating: 4, content: 'Solid bread lesson.', tags: ['Knowledgeable', 'Practical tips'], wouldRecommend: true },
    { key: 'R3', conn: 'C10', reviewer: 'gen5', reviewee: 'demo', skill: 'DEMO_PHONE', rating: 5, content: 'Phone basics made simple.', tags: ['Patient teacher', 'Clear explanations'], wouldRecommend: true },
    { key: 'R4', conn: 'C12', reviewer: 'gen7', reviewee: 'demo', skill: 'DEMO_GARDEN', rating: 3, content: 'Good but a bit rushed.', tags: ['Flexible'], wouldRecommend: false },
    { key: 'R5', conn: 'C8', reviewer: 'gen3', reviewee: 'demo', skill: 'DEMO_GARDEN', rating: 5, content: 'My roof garden is thriving now!', tags: ['Practical tips', 'Enthusiastic'], wouldRecommend: true },
    { key: 'R6', conn: 'C30', reviewer: 'ayesha', reviewee: 'demo', skill: 'DEMO_PHONE', rating: 5, content: 'Video calls finally work for me.', tags: ['Clear explanations', 'Punctual'], wouldRecommend: true },
    { key: 'R7', conn: 'C17', reviewer: 'demo', reviewee: 'noah', skill: 'NOAH_COMPOST', rating: 5, content: 'Noah set up my whole bin!', tags: ['Well-prepared', 'Enthusiastic'], wouldRecommend: true },
    { key: 'R8', conn: 'C16', reviewer: 'demo', reviewee: 'rahim', skill: 'RAHIM_PLUMB', rating: 4, content: 'Fixed my tap, very patient.', tags: ['Patient teacher', 'Knowledgeable'], wouldRecommend: true },
    { key: 'R9', conn: 'C18', reviewer: 'demo', reviewee: 'fatima', skill: 'FATIMA_UP', rating: 5, content: 'The shirt looks brand new!', tags: ['Great listener', 'Practical tips'], wouldRecommend: true },
    { key: 'R10', conn: 'C19', reviewer: 'demo', reviewee: 'pro', skill: 'PRO_MEAL', rating: 4, content: 'Great meal prep plan.', tags: ['Well-prepared'], wouldRecommend: true },
    { key: 'R11', conn: 'C21', reviewer: 'demo', reviewee: 'gen9', skill: 'GEN9_SKILL', rating: 5, content: 'Very helpful session.', tags: ['Clear explanations'], wouldRecommend: true },
    { key: 'R12', conn: 'C23', reviewer: 'demo', reviewee: 'gen11', skill: 'GEN11_SKILL', rating: 4, content: 'Good lesson overall.', tags: ['Knowledgeable'], wouldRecommend: true },
    { key: 'R13', conn: 'C24', reviewer: 'demo', reviewee: 'gen12', skill: 'GEN12_SKILL', rating: 5, content: 'Excellent.', tags: ['Enthusiastic'], wouldRecommend: true },
    { key: 'R14', conn: 'C27', reviewer: 'demo', reviewee: 'gen15', skill: 'GEN15_SKILL', rating: 5, content: 'Five stars!', tags: ['Punctual', 'Engaging'], wouldRecommend: true },
    { key: 'R15', conn: 'C31', reviewer: 'demo', reviewee: 'gen1', skill: 'GEN1_SKILL', rating: 4, content: 'Solid.', tags: ['Well-prepared'], wouldRecommend: true },
    { key: 'R16', conn: 'C32', reviewer: 'demo', reviewee: 'gen2', skill: 'GEN2_SKILL', rating: 5, content: 'Great swap.', tags: ['Engaging'], wouldRecommend: true },
    { key: 'R17', conn: 'C33', reviewer: 'demo', reviewee: 'gen3', skill: 'GEN3_SKILL', rating: 4, content: 'Good.', tags: ['Flexible'], wouldRecommend: true },
    { key: 'R18', conn: 'C28', reviewer: 'gen2', reviewee: 'gen1', skill: 'GEN2_SKILL', rating: 5, content: 'Practice swap went great.', tags: ['Patient teacher'], wouldRecommend: true },
    { key: 'R19', conn: 'C29', reviewer: 'kabir', reviewee: 'maria', skill: 'KABIR_BAKE', rating: 4, content: 'Maria is a quick learner.', tags: ['Engaging'], wouldRecommend: true },
  ];
  for (const input of reviewInputs) {
    R[input.key] = OID();
    await Review.create({
      _id: R[input.key],
      connectionId: C[input.conn],
      reviewerId: U[input.reviewer],
      revieweeId: U[input.reviewee],
      skillId: S[input.skill],
      rating: input.rating,
      content: input.content,
      tags: input.tags,
      wouldRecommend: input.wouldRecommend,
    });
  }

  console.log('\n== Seeding reports ==');
  const Rep: Record<string, Types.ObjectId> = {};
  const reportInputs: any[] = [
    { key: 'RP1', reporter: 'demo', targetType: 'user', targetUser: 'spam', reason: 'spam', description: 'User spamming advertisements.', status: 'open' },
    { key: 'RP2', reporter: 'gen1', targetType: 'skill', targetSkill: 'SPAM_GETRICH', reason: 'misleading', description: 'Fake get rich quick course.', status: 'open' },
    { key: 'RP3', reporter: 'gen2', targetType: 'message', targetMsg: 'M3', reason: 'harassment', description: 'Offensive message during a session.', status: 'under_review', assignedTo: U.moderator, contextMessages: [M.M3] },
    { key: 'RP4', reporter: 'gen1', targetType: 'review', targetReview: 'R7', reason: 'fake', description: 'Review looks suspicious.', status: 'resolved', assignedTo: U.admin, action: 'no_action', resolution: 'No issue found after review.' },
    { key: 'RP5', reporter: 'gen4', targetType: 'post', targetPost: 'P1', reason: 'inappropriate', description: 'Inappropriate community post.', status: 'resolved', assignedTo: U.admin, action: 'remove_content', resolution: 'Post content removed.' },
    { key: 'RP6', reporter: 'gen5', targetType: 'skill', targetSkill: 'DEMO_BAKE', reason: 'fake', description: 'Suspected fake listing.', status: 'dismissed', assignedTo: U.moderator, action: 'no_action', resolution: 'Listings verified as genuine.' },
    { key: 'RP7', reporter: 'gen6', targetType: 'post', targetPost: 'P2', reason: 'spam', description: 'Spam post.', status: 'under_review', assignedTo: U.moderator },
    { key: 'RP8', reporter: 'ayesha', targetType: 'user', targetUser: 'shadow', reason: 'other', description: 'Odd behaviour.', status: 'open' },
    { key: 'RP9', reporter: 'james', targetType: 'review', targetReview: 'R1', reason: 'fake', description: 'Rating seems inflated.', status: 'dismissed', assignedTo: U.admin, action: 'no_action', resolution: 'Legitimate rating.' },
    { key: 'RP10', reporter: 'demo', targetType: 'message', targetMsg: 'M7', reason: 'spam', description: 'Spammy message.', status: 'open', contextMessages: [M.M7] },
    { key: 'RP11', reporter: 'rahim', targetType: 'user', targetUser: 'spam', reason: 'harassment', description: 'Harassing other members.', status: 'resolved', assignedTo: U.admin, action: 'ban', resolution: 'User banned for repeated harassment.' },
    { key: 'RP12', reporter: 'kabir', targetType: 'post', targetPost: 'P3', reason: 'inappropriate', description: 'Report for testing queue.', status: 'under_review', assignedTo: U.admin },
  ];
  const P: Record<string, Types.ObjectId> = {};
  for (const input of reportInputs) {
    if (input.targetType === 'post') P[input.targetPost] = OID();
  }
  let reportIndex = 0;
  for (const input of reportInputs) {
    Rep[input.key] = OID();
    let targetId: Types.ObjectId;
    if (input.targetType === 'user') targetId = U[input.targetUser];
    else if (input.targetType === 'skill') targetId = S[input.targetSkill];
    else if (input.targetType === 'message') targetId = M[input.targetMsg];
    else if (input.targetType === 'review') targetId = R[input.targetReview];
    else targetId = P[input.targetPost];
    await Report.create({
      _id: Rep[input.key],
      reporterId: U[input.reporter],
      targetType: input.targetType,
      targetId,
      reason: input.reason,
      description: input.description,
      status: input.status,
      assignedTo: input.assignedTo,
      action: input.action,
      resolution: input.resolution,
      contextMessages: input.contextMessages ?? [],
      createdAt: daysAgo(reportIndex % 6),
    });
    reportIndex += 1;
  }

  console.log('\n== Seeding blocks ==');
  await Block.create([
    { blockerId: U.demo, blockedId: U.spam },
    { blockerId: U.spam, blockedId: U.demo },
    { blockerId: U.banned, blockedId: U.gen2 },
  ]);

  console.log('\n== Seeding skill swaps ==');
  const SW: Record<string, Types.ObjectId> = {};
  const swapInputs: any[] = [
    { key: 'SW1', a: 'demo', b: 'kabir', aSkill: 'DEMO_BAKE', bSkill: 'KABIR_BAKE', status: 'suggested' },
    { key: 'SW2', a: 'demo', b: 'maria', aSkill: 'DEMO_PHONE', bSkill: 'MARIA_SEW', status: 'accepted' },
    { key: 'SW3', a: 'demo', b: 'noah', aSkill: 'DEMO_GARDEN', bSkill: 'NOAH_COMPOST', status: 'declined', declinedBy: 'noah' },
  ];
  for (const input of swapInputs) {
    SW[input.key] = OID();
    await SkillSwap.create({
      _id: SW[input.key],
      userAId: U[input.a],
      userBId: U[input.b],
      userATeachesSkillId: S[input.aSkill],
      userBTeachesSkillId: S[input.bSkill],
      status: input.status,
      declinedBy: input.declinedBy ? U[input.declinedBy] : undefined,
    });
  }

  console.log('\n== Seeding group sessions ==');
  const GS: Record<string, Types.ObjectId> = {};
  const gsInputs: any[] = [
    { key: 'GS1', teacher: 'demo', skill: 'DEMO_BAKE', title: 'Weekend Sourdough Workshop', desc: 'A hands-on workshop for beginners.', max: 8, participants: ['kabir', 'maria'], format: 'in-person', status: 'open', type: 'workshop', scheduledAt: daysFromNow(3), chat: 'gs-001' },
    { key: 'GS2', teacher: 'demo', skill: 'DEMO_PHONE', title: 'Smartphone Basics Meetup', desc: 'Weekly open drop-in.', max: 10, participants: ['noah', 'gen1'], format: 'online', status: 'open', type: 'regular', scheduledAt: daysFromNow(5), chat: 'gs-002' },
    { key: 'GS3', teacher: 'kabir', skill: 'KABIR_BAKE', title: 'Bread Baking Circle', desc: 'Advanced dough handling.', max: 5, participants: ['demo', 'maria', 'rahim', 'fatima', 'noah'], format: 'in-person', status: 'full', type: 'regular', scheduledAt: daysFromNow(2), chat: 'gs-003' },
    { key: 'GS4', teacher: 'demo', skill: 'DEMO_GARDEN', title: 'Container Gardening Talk', desc: 'Past completed session.', max: 6, participants: ['gen1', 'gen2', 'gen3'], format: 'in-person', status: 'completed', type: 'workshop', scheduledAt: daysAgo(10), chat: 'gs-004' },
    { key: 'GS5', teacher: 'maria', skill: 'MARIA_SEW', title: 'Mending Circle', desc: 'Cancelled session.', max: 6, participants: ['demo'], format: 'online', status: 'cancelled', type: 'regular', scheduledAt: daysAgo(2), chat: 'gs-005', cancelledReason: 'Not enough interest' },
    { key: 'GS6', teacher: 'demo', skill: 'DEMO_BAKE', title: 'Flaky Pastry Masterclass', desc: 'Flagged content test session.', max: 8, participants: ['gen4', 'gen5', 'gen6'], format: 'either', status: 'open', type: 'workshop', scheduledAt: daysFromNow(7), chat: 'gs-006', flagged: true, flagReason: 'Reported as suspicious' },
    { key: 'GS7', teacher: 'rahim', skill: 'RAHIM_PLUMB', title: 'Fix a Leaky Tap', desc: 'Hands-on plumbing session.', max: 5, participants: ['demo', 'gen7', 'gen8', 'gen9', 'gen10'], format: 'in-person', status: 'full', type: 'regular', scheduledAt: daysFromNow(1), chat: 'gs-007' },
    { key: 'GS8', teacher: 'demo', skill: 'DEMO_PHONE', title: 'Senior Phone Help Hour', desc: 'Empty open session.', max: 8, participants: [], format: 'online', status: 'open', type: 'regular', scheduledAt: daysFromNow(10), chat: 'gs-008' },
  ];
  for (const input of gsInputs) {
    GS[input.key] = OID();
    await GroupSession.create({
      _id: GS[input.key],
      teacherId: U[input.teacher],
      skillId: S[input.skill],
      title: input.title,
      description: input.desc,
      maxParticipants: input.max,
      participants: input.participants.map((p: string) => U[p]),
      format: input.format,
      scheduledAt: input.scheduledAt,
      status: input.status,
      sessionType: input.type,
      chatRoomId: input.chat,
      cancelledReason: input.cancelledReason,
      isFlagged: input.flagged ?? false,
      flagReason: input.flagReason,
    });
  }

  console.log('\n== Seeding saved searches ==');
  await SavedSearch.create([
    { userId: U.demo, name: 'Baking teachers nearby', filters: { category: 'Food & Cooking', type: 'teach', radius: 10 }, alertEnabled: true, lastAlertSentAt: daysAgo(1) },
    { userId: U.demo, name: 'Online knitting', filters: { category: 'Textile & Craft', format: 'online' }, alertEnabled: false },
    { userId: U.demo, name: 'Beginner gardening', filters: { category: 'Home & Garden', proficiencyLevel: 'beginner' }, alertEnabled: true, lastAlertSentAt: daysAgo(2) },
  ]);

  console.log('\n== Seeding community posts ==');
  const postInputs: any[] = [
    { key: 'P1', author: 'demo', content: 'Who else is baking sourdough this weekend?', city: 'dhaka', neighborhood: 'gulshan', votes: [{ userId: U.maria, vote: 'up' }, { userId: U.kabir, vote: 'up' }, { userId: U.gen1, vote: 'down' }], score: 1 },
    { key: 'P2', author: 'maria', content: 'Sewing meetup at my place Friday!', city: 'dhaka', neighborhood: 'gulshan', votes: [{ userId: U.demo, vote: 'up' }, { userId: U.kabir, vote: 'up' }], score: 2 },
    { key: 'P3', author: 'nyc', content: 'Any knitters in Brooklyn?', city: 'new york', neighborhood: 'brooklyn', votes: [{ userId: U.london, vote: 'up' }], score: 1 },
    { key: 'P4', author: 'london', content: 'Allotment season is here!', city: 'london', neighborhood: 'camden', votes: [{ userId: U.nyc, vote: 'up' }], score: 1 },
    { key: 'P5', author: 'gen2', content: 'Selling cheap watches click here!!', city: 'dhaka', neighborhood: 'mirpur', votes: [{ userId: U.demo, vote: 'down' }, { userId: U.gen3, vote: 'down' }], score: -2, deleted: true },
    { key: 'P6', author: 'gen3', content: 'Roof garden harvest pics.', city: 'dhaka', neighborhood: 'dhanmondi', votes: [{ userId: U.demo, vote: 'up' }], score: 1 },
    { key: 'P7', author: 'gen4', content: 'Looking for a cooking buddy.', city: 'dhaka', neighborhood: 'banani', votes: [], score: 0 },
    { key: 'P8', author: 'gen5', content: 'Flagged spam post for the queue.', city: 'dhaka', neighborhood: 'uttara', votes: [], score: 0, flagged: true, flagReason: 'Spam advertisement' },
  ];
  for (const input of postInputs) {
    if (!P[input.key]) P[input.key] = OID();
    await CommunityPost.create({
      _id: P[input.key],
      authorId: U[input.author],
      content: input.content,
      city: input.city,
      neighborhood: input.neighborhood,
      voteScore: input.score,
      userVotes: input.votes,
      isDeleted: input.deleted ?? false,
      isFlagged: input.flagged ?? false,
      flagReason: input.flagReason,
    });
  }

  console.log('\n== Seeding endorsements ==');
  await Endorsement.create([
    { endorserId: U.kabir, endorseeId: U.demo, skillId: S.DEMO_BAKE, connectionId: C.C2 },
    { endorserId: U.maria, endorseeId: U.demo, skillId: S.DEMO_PHONE, connectionId: C.C1 },
    { endorserId: U.demo, endorseeId: U.noah, skillId: S.NOAH_COMPOST, connectionId: C.C17 },
    { endorserId: U.demo, endorseeId: U.rahim, skillId: S.RAHIM_PLUMB, connectionId: C.C16 },
    { endorserId: U.gen1, endorseeId: U.demo, skillId: S.DEMO_BAKE, connectionId: C.C6 },
    { endorserId: U.fatima, endorseeId: U.demo, skillId: S.DEMO_GARDEN, connectionId: C.C4 },
    { endorserId: U.demo, endorseeId: U.fatima, skillId: S.FATIMA_UP, connectionId: C.C18 },
  ]);

  console.log('\n== Seeding audit logs ==');
  await AuditLog.create([
    { performedBy: U.admin, action: 'suspend', targetType: 'user', targetId: U.spam, before: { status: 'active' }, after: { status: 'suspended' }, metadata: { reason: 'spam' } },
    { performedBy: U.admin, action: 'ban', targetType: 'user', targetId: U.banned, before: { status: 'suspended' }, after: { status: 'banned' }, metadata: { reason: 'harassment' } },
    { performedBy: U.moderator, action: 'warn', targetType: 'user', targetId: U.shadow, after: { warned: true }, metadata: {} },
    { performedBy: U.moderator, action: 'remove_content', targetType: 'post', targetId: P.P5, before: { isDeleted: false }, after: { isDeleted: true }, metadata: {} },
    { performedBy: U.admin, action: 'resolve', targetType: 'report', targetId: Rep.RP4, before: { status: 'under_review' }, after: { status: 'resolved' }, metadata: { action: 'no_action' } },
    { performedBy: U.moderator, action: 'remove_content', targetType: 'message', targetId: M.M3, before: { isReported: false }, after: { isReported: true }, metadata: {} },
    { performedBy: U.admin, action: 'no_action', targetType: 'review', targetId: R.R9, after: {}, metadata: { note: 'Reviewed, no action.' } },
    { performedBy: U.admin, action: 'update', targetType: 'category', targetId: catBySlug.get('food-cooking')!._id, after: { displayOrder: 1 }, metadata: {} },
  ]);

  console.log('\n== Seeding auth tokens ==');
  await RefreshToken.create([
    { userId: U.demo, tokenHash: 'hashed_refresh_demo_valid', expiresAt: daysFromNow(30) },
    { userId: U.demo, tokenHash: 'hashed_refresh_demo_revoked', expiresAt: daysFromNow(30), revokedAt: daysAgo(1) },
    { userId: U.kabir, tokenHash: 'hashed_refresh_kabir', expiresAt: daysFromNow(30) },
  ]);
  await EmailVerificationToken.create([
    { userId: U.unverified, tokenHash: 'hashed_verify_unverified', expiresAt: daysFromNow(1) },
    { userId: U.demo, tokenHash: 'hashed_verify_demo', expiresAt: daysAgo(10), isUsed: true },
  ]);
  await PasswordResetToken.create([
    { userId: U.demo, tokenHash: 'hashed_reset_demo', expiresAt: daysFromNow(1) },
    { userId: U.gen1, tokenHash: 'hashed_reset_gen1', expiresAt: daysAgo(5), isUsed: true },
  ]);
  await OAuthProvider.create([
    { userId: U.demo, provider: 'google', providerUserId: 'google_12345', email: 'demo@skillhearth.test', displayName: 'Demo Tester' },
    { userId: U.nyc, provider: 'apple', providerUserId: 'apple_98765', email: 'nyc@skillhearth.test', displayName: 'NYC Sarah' },
  ]);
  await TwoFactorSecret.create([
    { userId: U.demo, secret: 'JBSWY3DPEHPK3PXP', enabled: true, lastUsedAt: daysAgo(2) },
    { userId: U.pro, secret: 'KRSXG5CTMVRXEZLU', enabled: false },
  ]);
  await TokenBlacklist.create([
    { tokenId: 'jti_blacklisted_access', type: 'access', expiresAt: daysFromNow(1) },
    { tokenId: 'jti_blacklisted_refresh', type: 'refresh', expiresAt: daysFromNow(30) },
  ]);

  console.log('\n== Seeding skill suggestions ==');
  const SS: Record<string, Types.ObjectId> = {};
  await SkillSuggestion.create([
    { _id: (SS.SU1 = OID()), userId: U.gen1, skillName: 'Carpentry Basics', categoryName: 'Home & Garden', description: 'Woodworking for beginners.', status: 'pending', votes: 3, votedBy: [U.demo, U.maria, U.kabir] },
    { _id: (SS.SU2 = OID()), userId: U.demo, skillName: 'Pottery', categoryName: 'Textile & Craft', description: 'Hand building and wheel throwing.', status: 'approved', votes: 5, votedBy: [U.demo, U.gen1, U.gen2, U.gen3, U.maria], reviewedBy: U.admin, reviewedAt: daysAgo(2), adminNotes: 'Great addition to the taxonomy.' },
    { _id: (SS.SU3 = OID()), userId: U.gen2, skillName: 'Candle Making', categoryName: 'Textile & Craft', description: 'Soy candle pouring.', status: 'rejected', votes: 1, votedBy: [U.gen2], reviewedBy: U.admin, reviewedAt: daysAgo(4), adminNotes: 'Duplicate of existing category.' },
  ]);

  console.log('\n== Seeding skill bundles ==');
  const SB: Record<string, Types.ObjectId> = {};
  await SkillBundle.create([
    { _id: (SB.SB1 = OID()), name: 'Beginner Kitchen Pack', description: 'Everything to start cooking.', skillIds: [S.DEMO_BAKE, S.KABIR_BAKE, S.PRO_MEAL], isOfficial: true, createdBy: U.admin, votes: 12, votedBy: [U.demo, U.maria, U.kabir, U.fatima, U.noah, U.gen1, U.gen2, U.gen3, U.gen4, U.gen5, U.gen6, U.gen7], coverImage: 'https://res.cloudinary.com/demo/image/upload/v1/bundles/kitchen.jpg' },
    { _id: (SB.SB2 = OID()), name: 'Community Craft Bundle', description: 'Crafts curated by the community.', skillIds: [S.MARIA_SEW, S.FATIMA_UP, S.NYC_KNIT], isOfficial: false, createdBy: U.demo, votes: 4, votedBy: [U.demo, U.maria, U.kabir, U.noah], coverImage: '' },
  ]);

  console.log('\n== Seeding block out dates ==');
  await BlockOutDate.create([
    { userId: U.demo, date: daysFromNow(3), reason: 'Doctor appointment' },
    { userId: U.demo, date: daysFromNow(7), reason: 'Out of town' },
    { userId: U.demo, date: daysFromNow(14), reason: 'Family event' },
    { userId: U.kabir, date: daysFromNow(4), reason: 'Holiday' },
    { userId: U.maria, date: daysFromNow(2), reason: 'Personal' },
  ]);

  console.log('\n== Seeding learner requests ==');
  await LearnerRequest.create([
    { authorId: U.demo, skillName: 'Knitting / Crochet', categoryName: 'Textile & Craft', description: 'Want to knit a scarf this winter.', city: 'dhaka', neighborhood: 'gulshan', format: 'in-person', availability: ['Weekends'], status: 'open', responsesCount: 2 },
    { authorId: U.gen1, skillName: 'Basic Plumbing', categoryName: 'Home & Garden', description: 'Fix a leaking tap.', city: 'dhaka', neighborhood: 'uttara', format: 'in-person', availability: ['Evenings'], status: 'open', responsesCount: 1 },
    { authorId: U.gen2, skillName: 'Vegetable Gardening', categoryName: 'Home & Garden', description: 'Balcony garden setup.', city: 'dhaka', neighborhood: 'banani', format: 'either', availability: [], status: 'filled', responsesCount: 3 },
    { authorId: U.gen3, skillName: 'Sewing & Mending', categoryName: 'Textile & Craft', description: 'Mend old jeans.', city: 'dhaka', neighborhood: 'dhanmondi', format: 'online', availability: [], status: 'expired', responsesCount: 0 },
    { authorId: U.gen4, skillName: 'Smartphone Basics', categoryName: 'Digital Literacy', description: 'Help my grandmother with her phone.', city: 'dhaka', neighborhood: 'mirpur', format: 'in-person', availability: [], status: 'deleted', responsesCount: 1 },
  ]);

  console.log('\n== Seeding session notes ==');
  await SessionNote.create([
    { connectionId: C.C4, userId: U.demo, content: 'Covered container setup, soil mix and watering schedule.' },
    { connectionId: C.C9, userId: U.demo, content: 'Sourdough starter feeding and first bake.' },
    { connectionId: C.C16, userId: U.demo, content: 'Learned to replace a tap washer.' },
    { connectionId: C.C2, userId: U.kabir, content: 'Practised shaping and scoring.' },
  ]);

  console.log('\n== Seeding tips ==');
  const tips: any[] = [
    { payer: 'gen1', payee: 'demo', conn: 'C6', amount: 500, status: 'completed', fee: 50, pi: 'pi_test_1' },
    { payer: 'gen2', payee: 'demo', conn: 'C7', amount: 300, status: 'pending', fee: 30 },
    { payer: 'demo', payee: 'noah', conn: 'C17', amount: 200, status: 'completed', fee: 20, pi: 'pi_test_2' },
    { payer: 'gen3', payee: 'demo', conn: 'C8', amount: 1000, status: 'completed', fee: 100, pi: 'pi_test_3' },
    { payer: 'gen4', payee: 'demo', conn: 'C9', amount: 150, status: 'failed', fee: 15, pi: 'pi_test_4' },
    { payer: 'gen5', payee: 'demo', conn: 'C10', amount: 750, status: 'refunded', fee: 75, pi: 'pi_test_5' },
  ];
  for (const t of tips) {
    await Tip.create({
      payerId: U[t.payer],
      payeeId: U[t.payee],
      connectionId: C[t.conn],
      amount: t.amount,
      currency: 'usd',
      stripePaymentIntentId: t.pi,
      status: t.status,
      platformFee: t.fee,
    });
  }

  console.log('\n== Seeding courses ==');
  const CR: Record<string, Types.ObjectId> = {};
  const courseInputs: any[] = [
    { key: 'CR1', teacher: 'demo', skill: 'DEMO_BAKE', title: 'Baking Fundamentals', desc: 'A complete beginner baking course.', sessions: [
      { title: 'Bread Basics', description: 'Flour, water, yeast.', objectives: ['Mix dough', 'Understand proofing'], order: 0, estimatedMinutes: 60 },
      { title: 'Kneading', description: 'Hand and machine kneading.', objectives: ['Windowpane test'], order: 1, estimatedMinutes: 60 },
      { title: 'Shaping & Scoring', description: 'Final shaping.', objectives: ['Shape boule'], order: 2, estimatedMinutes: 60 },
      { title: 'Baking & Steam', description: 'Oven technique.', objectives: ['Bake with steam'], order: 3, estimatedMinutes: 60 },
    ], max: 20, count: 3, status: 'published', total: 240 },
    { key: 'CR2', teacher: 'demo', skill: 'DEMO_PHONE', title: 'Smartphone Essentials', desc: 'Draft course.', sessions: [
      { title: 'Settings', objectives: ['Basics'], order: 0, estimatedMinutes: 40 },
      { title: 'Photos', objectives: ['Camera'], order: 1, estimatedMinutes: 40 },
      { title: 'Safety', objectives: ['Privacy'], order: 2, estimatedMinutes: 40 },
    ], max: 10, count: 0, status: 'draft', total: 120 },
    { key: 'CR3', teacher: 'kabir', skill: 'KABIR_BAKE', title: 'Sourdough Mastery', desc: 'Advanced sourdough.', sessions: [
      { title: 'Starter', objectives: ['Feed'], order: 0, estimatedMinutes: 60 },
      { title: 'Autolyse', objectives: ['Technique'], order: 1, estimatedMinutes: 60 },
      { title: 'Lamination', objectives: ['Stretch and fold'], order: 2, estimatedMinutes: 60 },
      { title: 'Cold Proof', objectives: ['Fermentation'], order: 3, estimatedMinutes: 60 },
      { title: 'Scoring & Bake', objectives: ['Ear'], order: 4, estimatedMinutes: 60 },
    ], max: 15, count: 2, status: 'published', total: 300 },
    { key: 'CR4', teacher: 'maria', skill: 'MARIA_SEW', title: 'Mending 101', desc: 'Archived course.', sessions: [
      { title: 'Thread & Needle', objectives: ['Threading'], order: 0, estimatedMinutes: 45 },
      { title: 'Patch a Hole', objectives: ['Darning'], order: 1, estimatedMinutes: 45 },
      { title: 'Sew a Button', objectives: ['Buttons'], order: 2, estimatedMinutes: 45 },
    ], max: 10, count: 1, status: 'archived', total: 135 },
  ];
  for (const input of courseInputs) {
    CR[input.key] = OID();
    await Course.create({
      _id: CR[input.key],
      teacherId: U[input.teacher],
      skillId: S[input.skill],
      title: input.title,
      description: input.desc,
      sessions: input.sessions,
      maxEnrollments: input.max,
      enrollmentCount: input.count,
      status: input.status,
      totalEstimatedMinutes: input.total,
    });
  }

  console.log('\n== Seeding course enrollments ==');
  const CE: Record<string, Types.ObjectId> = {};
  const ceInputs: any[] = [
    { key: 'CE1', course: 'CR1', learner: 'gen1', status: 'in_progress', progress: [{ sessionIndex: 0, completed: true, completedAt: daysAgo(1), notes: 'Great!' }, { sessionIndex: 1, completed: false }], startedAt: daysAgo(5) },
    { key: 'CE2', course: 'CR1', learner: 'gen2', status: 'enrolled', progress: [], startedAt: daysAgo(1) },
    { key: 'CE3', course: 'CR1', learner: 'gen3', status: 'completed', progress: [{ sessionIndex: 0, completed: true }, { sessionIndex: 1, completed: true }, { sessionIndex: 2, completed: true }, { sessionIndex: 3, completed: true }], startedAt: daysAgo(30), completedAt: daysAgo(1), certificateId: 'cert_001' },
    { key: 'CE4', course: 'CR3', learner: 'demo', status: 'in_progress', progress: [{ sessionIndex: 0, completed: true, completedAt: daysAgo(2) }, { sessionIndex: 1, completed: false }], startedAt: daysAgo(6) },
    { key: 'CE5', course: 'CR3', learner: 'maria', status: 'enrolled', progress: [], startedAt: daysAgo(2) },
    { key: 'CE6', course: 'CR4', learner: 'kabir', status: 'dropped', progress: [{ sessionIndex: 0, completed: true }], startedAt: daysAgo(20) },
    { key: 'CE7', course: 'CR3', learner: 'gen2', status: 'completed', progress: [{ sessionIndex: 0, completed: true }, { sessionIndex: 1, completed: true }, { sessionIndex: 2, completed: true }, { sessionIndex: 3, completed: true }, { sessionIndex: 4, completed: true }], startedAt: daysAgo(40), completedAt: daysAgo(3), certificateId: 'cert_002' },
  ];
  for (const input of ceInputs) {
    CE[input.key] = OID();
    await CourseEnrollment.create({
      _id: CE[input.key],
      courseId: CR[input.course],
      learnerId: U[input.learner],
      status: input.status,
      progress: input.progress,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      certificateId: input.certificateId,
    });
  }

  console.log('\n== Seeding challenges ==');
  const CH: Record<string, Types.ObjectId> = {};
  const chInputs: any[] = [
    { key: 'CH1', creator: 'demo', title: 'Bake 10 Loaves', desc: 'Ten loaves in a month.', cat: 'Food & Cooking', type: 'both', goal: 'Bake 10 loaves', target: 10, start: daysAgo(3), end: daysFromNow(27), status: 'active', participants: [{ userId: U.demo, joinedAt: daysAgo(3), progress: 4 }, { userId: U.maria, joinedAt: daysAgo(2), progress: 2 }], badge: 'Bread Champion', icon: '🍞', max: 50 },
    { key: 'CH2', creator: 'kabir', title: 'Sourdough Summer', desc: 'Upcoming challenge.', cat: 'Food & Cooking', type: 'teach', goal: 'Teach 5 sourdough lessons', target: 5, start: daysFromNow(5), end: daysFromNow(35), status: 'upcoming', participants: [], badge: 'Sourdough Sage', icon: '🥖' },
    { key: 'CH3', creator: 'demo', title: 'Gardening Week', desc: 'Completed challenge.', cat: 'Home & Garden', type: 'learn', goal: 'Learn 3 gardening skills', target: 3, start: daysAgo(30), end: daysAgo(2), status: 'completed', participants: [{ userId: U.demo, joinedAt: daysAgo(30), progress: 3, completedAt: daysAgo(2) }, { userId: U.fatima, joinedAt: daysAgo(28), progress: 3, completedAt: daysAgo(3) }], badge: 'Green Thumb', icon: '🌱' },
    { key: 'CH4', creator: 'maria', title: 'Mending March', desc: 'Cancelled challenge.', cat: 'Textile & Craft', type: 'both', goal: 'Mend 5 items', target: 5, start: daysAgo(2), end: daysFromNow(10), status: 'cancelled', participants: [{ userId: U.gen1, joinedAt: daysAgo(1), progress: 0 }], badge: 'Stitch Wizard', icon: '🧵' },
  ];
  for (const input of chInputs) {
    CH[input.key] = OID();
    await Challenge.create({
      _id: CH[input.key],
      creatorId: U[input.creator],
      title: input.title,
      description: input.desc,
      skillCategory: input.cat,
      challengeType: input.type,
      goalDescription: input.goal,
      goalTarget: input.target,
      startDate: input.start,
      endDate: input.end,
      status: input.status,
      participants: input.participants,
      badgeName: input.badge,
      badgeIcon: input.icon,
      maxParticipants: input.max,
    });
  }

  console.log('\n== Seeding mentorships ==');
  const MS: Record<string, Types.ObjectId> = {};
  const msInputs: any[] = [
    { key: 'MS1', mentor: 'demo', mentee: 'gen1', skill: 'DEMO_BAKE', status: 'active', goals: [{ title: 'Master sourdough', description: 'Learn full process', targetDate: daysFromNow(30), completed: false }, { title: 'Bake weekly', description: 'Once a week', completed: true, completedAt: daysAgo(5) }], checkIns: [{ date: daysAgo(3), notes: 'Practised scoring.', mentorNotes: 'Keep hydration at 75%.' }], startDate: daysAgo(14), targetEndDate: daysFromNow(76), durationMonths: 3, meeting: 'weekly' },
    { key: 'MS2', mentor: 'demo', mentee: 'gen2', skill: 'DEMO_PHONE', status: 'pending', goals: [{ title: 'Phone setup', completed: false }], checkIns: [], startDate: daysAgo(1), durationMonths: 2, meeting: 'biweekly' },
    { key: 'MS3', mentor: 'kabir', mentee: 'demo', skill: 'KABIR_BAKE', status: 'active', goals: [{ title: 'Baguette technique', completed: false }], checkIns: [{ date: daysAgo(6), notes: 'Worked on shaping.', mentorNotes: 'Good progress.' }], startDate: daysAgo(10), durationMonths: 2, meeting: 'weekly' },
    { key: 'MS4', mentor: 'demo', mentee: 'gen3', skill: 'DEMO_GARDEN', status: 'completed', goals: [{ title: 'Container setup', completed: true, completedAt: daysAgo(4) }], checkIns: [{ date: daysAgo(12), notes: 'Set up pots.', mentorNotes: 'Done.' }], startDate: daysAgo(40), completedAt: daysAgo(4), durationMonths: 2, meeting: 'monthly' },
    { key: 'MS5', mentor: 'maria', mentee: 'demo', skill: 'MARIA_SEW', status: 'paused', goals: [{ title: 'Finish apron', completed: false }], checkIns: [{ date: daysAgo(15), notes: 'Halfway through.' }], startDate: daysAgo(20), durationMonths: 1, meeting: 'weekly' },
    { key: 'MS6', mentor: 'pro', mentee: 'demo', skill: 'PRO_MEAL', status: 'cancelled', goals: [], checkIns: [], startDate: daysAgo(5), durationMonths: 1, meeting: 'weekly' },
  ];
  for (const input of msInputs) {
    MS[input.key] = OID();
    await Mentorship.create({
      _id: MS[input.key],
      mentorId: U[input.mentor],
      menteeId: U[input.mentee],
      skillId: S[input.skill],
      status: input.status,
      goals: input.goals,
      checkIns: input.checkIns,
      startDate: input.startDate,
      targetEndDate: input.targetEndDate,
      completedAt: input.completedAt,
      durationMonths: input.durationMonths,
      meetingFrequency: input.meeting,
    });
  }

  console.log('\n== Seeding showcases ==');
  await Showcase.create([
    { userId: U.demo, skillId: S.DEMO_BAKE, title: 'First sourdough loaf', description: 'My first successful bake.', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/loaf.jpg', publicId: 'show/loaf', caption: 'Golden crust' }, { url: 'https://res.cloudinary.com/demo/image/upload/v1/show/crumb.jpg', publicId: 'show/crumb' }], likes: [{ userId: U.maria, createdAt: daysAgo(1) }, { userId: U.kabir, createdAt: daysAgo(1) }, { userId: U.noah, createdAt: daysAgo(1) }], likeCount: 3, commentCount: 2 },
    { userId: U.maria, skillId: S.MARIA_SEW, title: 'Mended jeans', description: 'Invisible mending on old jeans.', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/jeans.jpg', publicId: 'show/jeans' }], likes: [{ userId: U.demo, createdAt: daysAgo(2) }], likeCount: 1, commentCount: 0 },
    { userId: U.kabir, skillId: S.KABIR_BAKE, title: 'Baguette day', description: 'Morning bake.', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/baguette.jpg', publicId: 'show/baguette' }], likes: [{ userId: U.demo, createdAt: daysAgo(3) }, { userId: U.maria, createdAt: daysAgo(3) }], likeCount: 2, commentCount: 1 },
    { userId: U.spam, skillId: S.SPAM_GETRICH, title: 'Deleted showcase', description: 'Removed content test.', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/spam.jpg', publicId: 'show/spam' }], likes: [], likeCount: 0, commentCount: 0, isDeleted: true },
    { userId: U.nyc, skillId: S.NYC_KNIT, title: 'Scarf in progress', description: 'Brooklyn knitter checking in.', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/scarf.jpg', publicId: 'show/scarf' }], likes: [{ userId: U.demo, createdAt: daysAgo(4) }], likeCount: 1, commentCount: 0 },
  ]);

  console.log('\n== Seeding webhooks ==');
  const WH: Record<string, Types.ObjectId> = {};
  await Webhook.create([
    { _id: (WH.WH1 = OID()), ownerId: U.demo, url: 'https://example.com/hook1', events: ['session.completed', 'member.joined', 'skill.created'], secret: 'whsec_test_1', status: 'active', failCount: 0, lastTriggeredAt: daysAgo(1), lastSuccessAt: daysAgo(1), logs: [{ event: 'session.completed', payload: { ok: true }, statusCode: 200, success: true, attemptedAt: daysAgo(1) }] },
    { _id: (WH.WH2 = OID()), ownerId: U.demo, url: 'https://example.com/hook2', events: ['review.created'], secret: 'whsec_test_2', status: 'disabled', failCount: 2, lastTriggeredAt: daysAgo(3), logs: [{ event: 'review.created', payload: {}, statusCode: 500, success: false, error: 'Timeout', attemptedAt: daysAgo(3) }] },
    { _id: (WH.WH3 = OID()), ownerId: U.kabir, url: 'https://example.com/hook3', events: ['connection.completed'], secret: 'whsec_test_3', status: 'failed', failCount: 5, lastTriggeredAt: daysAgo(4), logs: [{ event: 'connection.completed', payload: {}, statusCode: 500, success: false, error: 'Invalid URL', attemptedAt: daysAgo(4) }] },
  ]);

  console.log('\n== Seeding API keys ==');
  await ApiKey.create([
    { ownerId: U.demo, key: 'sk_test_demo_active_1', name: 'Demo Active Key', scopes: ['skills:read', 'stats:read'], status: 'active', rateLimit: 100, requestCount: 42, lastUsedAt: daysAgo(1), expiresAt: daysFromNow(60) },
    { ownerId: U.demo, key: 'sk_test_demo_revoked_2', name: 'Demo Revoked Key', scopes: ['skills:read'], status: 'revoked', rateLimit: 100, requestCount: 10, lastUsedAt: daysAgo(10) },
    { ownerId: U.kabir, key: 'sk_test_kabir_1', name: 'Kabir Key', scopes: ['users:read'], status: 'active', rateLimit: 100, requestCount: 5, lastUsedAt: daysAgo(2) },
  ]);

  console.log('\n== Seeding calendar integrations ==');
  await CalendarIntegration.create([
    { userId: U.demo, provider: 'google', accessToken: 'at_google_demo', refreshToken: 'rt_google_demo', calendarId: 'primary', calendarName: 'Primary', syncStatus: 'active', lastSyncedAt: daysAgo(1), syncToken: 'sync_1', events: [{ externalId: 'ev_1', title: 'Baking session with Kabir', start: daysFromNow(1), end: daysFromNow(1), description: 'Sourdough lesson', location: 'Gulshan', connectionId: C.C2 }] },
    { userId: U.demo, provider: 'outlook', accessToken: 'at_outlook_demo', refreshToken: 'rt_outlook_demo', calendarId: 'outlook', calendarName: 'Outlook', syncStatus: 'error', lastSyncedAt: daysAgo(5), syncToken: 'sync_2', events: [] },
    { userId: U.maria, provider: 'google', accessToken: 'at_google_maria', refreshToken: 'rt_google_maria', calendarId: 'primary', calendarName: 'Primary', syncStatus: 'pending', events: [] },
    { userId: U.kabir, provider: 'google', accessToken: 'at_google_kabir', refreshToken: 'rt_google_kabir', calendarId: 'primary', calendarName: 'Primary', syncStatus: 'disabled', events: [] },
  ]);

  console.log('\n== Seeding bot installations ==');
  await BotInstallation.create([
    { externalId: 'ext_slack_demo', name: 'Skill Hearth Bot', platform: 'slack', accessToken: 'at_slack_demo', botToken: 'bt_slack_demo', teamId: 'T_DEMO', teamName: 'Demo Workspace', channelId: 'C_DEMO', channelName: 'general', installedBy: U.demo, status: 'active', lastUsedAt: daysAgo(1), commandCount: 15 },
    { externalId: 'ext_discord_demo', name: 'Hearth Bot', platform: 'discord', accessToken: 'at_discord_demo', botToken: 'bt_discord_demo', installedBy: U.demo, status: 'disabled', commandCount: 3 },
    { externalId: 'ext_slack_kabir', name: 'Kabir Bot', platform: 'slack', accessToken: 'at_slack_kabir', botToken: 'bt_slack_kabir', installedBy: U.kabir, status: 'active', commandCount: 8 },
    { externalId: 'ext_discord_gen', name: 'Gen Bot', platform: 'discord', accessToken: 'at_discord_gen', botToken: 'bt_discord_gen', installedBy: U.gen1, status: 'error', commandCount: 1 },
  ]);

  console.log('\n== Seeding friendships ==');
  const F: Record<string, Types.ObjectId> = {};
  const friendshipInputs: any[] = [
    { key: 'F1', requester: 'demo', addressee: 'maria', status: 'accepted', reqTier: 'close_friend', addrTier: 'close_friend', metVia: 'skill_session', sharedSkill: 'DEMO_PHONE', acceptedAt: daysAgo(20) },
    { key: 'F2', requester: 'kabir', addressee: 'demo', status: 'accepted', reqTier: 'friend', addrTier: 'friend', metVia: 'friend_request', acceptedAt: daysAgo(15) },
    { key: 'F3', requester: 'demo', addressee: 'rahim', status: 'accepted', reqTier: 'friend', addrTier: 'friend', metVia: 'group_session', acceptedAt: daysAgo(12) },
    { key: 'F4', requester: 'demo', addressee: 'fatima', status: 'accepted', reqTier: 'friend', addrTier: 'friend', metVia: 'friend_request', acceptedAt: daysAgo(10) },
    { key: 'F5', requester: 'demo', addressee: 'noah', status: 'accepted', reqTier: 'friend', addrTier: 'friend', metVia: 'friend_request', acceptedAt: daysAgo(8) },
    { key: 'F6', requester: 'ayesha', addressee: 'demo', status: 'pending', reqTier: 'friend', addrTier: 'friend', expiresAt: daysFromNow(30) },
    { key: 'F7', requester: 'demo', addressee: 'james', status: 'pending', reqTier: 'friend', addrTier: 'friend', expiresAt: daysFromNow(30) },
    { key: 'F8', requester: 'gen1', addressee: 'demo', status: 'declined', reqTier: 'friend', addrTier: 'friend', declinedAt: daysAgo(5) },
    { key: 'F9', requester: 'banned', addressee: 'gen2', status: 'blocked', reqTier: 'friend', addrTier: 'friend' },
  ];
  for (const input of friendshipInputs) {
    F[input.key] = OID();
    await Friendship.create({
      _id: F[input.key],
      requesterId: U[input.requester],
      addresseeId: U[input.addressee],
      status: input.status,
      requesterTier: input.reqTier,
      addresseeTier: input.addrTier,
      showStreakTo: { requester: true, addressee: true },
      metVia: input.metVia,
      sharedSkillId: input.sharedSkill ? S[input.sharedSkill] : undefined,
      directMessageRoomId: getDirectMessageRoomId(String(U[input.requester]), String(U[input.addressee])),
      expiresAt: input.expiresAt,
      acceptedAt: input.acceptedAt,
      declinedAt: input.declinedAt,
    });
  }

  console.log('\n== Seeding notifications ==');
  const notificationInputs: any[] = [
    { user: 'demo', type: 'request_received', referenceModel: 'Connection', reference: 'C1', message: 'Maria Ahmed sent you a skill request.', isRead: false },
    { user: 'demo', type: 'request_accepted', referenceModel: 'Connection', reference: 'C14', message: 'Kabir Hossain accepted your request.', isRead: true },
    { user: 'demo', type: 'request_rejected', referenceModel: 'Connection', reference: 'C3', message: 'Your request was declined by rahim.', isRead: false },
    { user: 'demo', type: 'new_message', referenceModel: 'Message', reference: 'M1', message: 'New message from Kabir Hossain.', isRead: false },
    { user: 'demo', type: 'review_prompt', referenceModel: 'Connection', reference: 'C6', message: 'You have a session ready to review.', isRead: false },
    { user: 'demo', type: 'system_warning', referenceModel: 'Report', reference: 'RP1', message: 'Your report has been received and is under review.', isRead: true },
    { user: 'demo', type: 'review_received', referenceModel: 'Review', reference: 'R1', message: 'Fatima Begum reviewed you 5 stars!', isRead: false },
    { user: 'demo', type: 'group_session_joined', referenceModel: 'GroupSession', reference: 'GS1', message: 'You joined Weekend Sourdough Workshop.', isRead: true },
    { user: 'demo', type: 'group_session_left', referenceModel: 'GroupSession', reference: 'GS1', message: 'You left a group session.', isRead: true },
    { user: 'demo', type: 'group_session_completed', referenceModel: 'GroupSession', reference: 'GS4', message: 'Container Gardening Talk is complete.', isRead: true },
    { user: 'demo', type: 'group_session_cancelled', referenceModel: 'GroupSession', reference: 'GS5', message: 'A group session was cancelled.', isRead: false },
    { user: 'demo', type: 'friend_request', referenceModel: 'Friendship', reference: 'F6', message: 'Ayesha Siddiqua sent you a friend request.', isRead: false },
    { user: 'demo', type: 'friend_request_accepted', referenceModel: 'Friendship', reference: 'F1', message: 'Maria Ahmed accepted your friend request.', isRead: true },
    { user: 'demo', type: 'friend_joined', referenceModel: 'Friendship', reference: 'F2', message: 'Kabir Hossain is now your friend.', isRead: true },
    { user: 'spam', type: 'account_suspended', referenceModel: 'Report', reference: 'RP11', message: 'Your account has been suspended.', isRead: false },
    { user: 'banned', type: 'account_banned', message: 'Your account has been banned.', isRead: false },
    { user: 'gen2', type: 'skill_removed', referenceModel: 'Skill', reference: 'GEN2_SKILL', message: 'A skill you created was removed.', isRead: true },
    { user: 'demo', type: 'review_prompt', referenceModel: 'Connection', reference: 'C16', message: 'You have a session ready to review.', isRead: false },
    { user: 'demo', type: 'new_message', referenceModel: 'Message', reference: 'M10', message: 'New message from gen1.', isRead: false },
    { user: 'demo', type: 'request_received', referenceModel: 'Connection', reference: 'C13', message: 'Ayesha Siddiqua sent you a skill request.', isRead: true },
  ];
  for (const input of notificationInputs) {
    await Notification.create({
      userId: U[input.user],
      type: input.type,
      referenceId: input.reference ? (C[input.reference] ?? R[input.reference] ?? M[input.reference] ?? S[input.reference] ?? Rep[input.reference] ?? GS[input.reference] ?? F[input.reference]) : undefined,
      referenceModel: input.referenceModel,
      message: input.message,
      isRead: input.isRead,
    });
  }

  console.log('\n== Seeding activity events ==');
  const AE: Record<string, Types.ObjectId> = {};
  const aeInputs: any[] = [
    { key: 'AE1', actor: 'maria', eventType: 'skill_added', subjectType: 'skill', subject: 'MARIA_SEW', title: 'Maria added a new skill: Sewing & Mending 🧵', subtitle: 'Textile & Craft', visibility: 'friends', ago: 2, expires: 90, reactions: [{ userId: U.demo, emoji: '❤️', createdAt: daysAgo(1) }], commentCount: 1 },
    { key: 'AE2', actor: 'kabir', eventType: 'badge_earned', subjectType: 'badge', subject: 'first_spark', title: 'Kabir earned a badge ✨', subtitle: 'First Spark', visibility: 'public', ago: 3, expires: 90, reactions: [{ userId: U.demo, emoji: '👏', createdAt: daysAgo(2) }] },
    { key: 'AE3', actor: 'demo', eventType: 'session_taught', subjectType: 'connection', subject: 'C4', title: 'Demo taught a session 🧑‍🏫', subtitle: 'Vegetable Gardening', visibility: 'friends', ago: 4, expires: 90, reactions: [{ userId: U.maria, emoji: '🎉', createdAt: daysAgo(3) }] },
    { key: 'AE4', actor: 'maria', eventType: 'streak_milestone', subjectType: 'streak', subject: null, title: 'Maria hit a 7-day streak 🔥', subtitle: 'Learning', visibility: 'close_friends', ago: 1, expires: 90, reactions: [{ userId: U.demo, emoji: '🔥', createdAt: daysAgo(1) }] },
    { key: 'AE5', actor: 'kabir', eventType: 'session_completed', subjectType: 'connection', subject: 'C29', title: 'Kabir completed a session 🎓', subtitle: 'Baking', visibility: 'friends', ago: 5, expires: 90, reactions: [{ userId: U.demo, emoji: '👍', createdAt: daysAgo(4) }] },
    { key: 'AE6', actor: 'noah', eventType: 'skill_swap_accepted', subjectType: 'swap', subject: 'SW3', title: 'Noah accepted a skill swap 🔀', subtitle: 'Composting', visibility: 'friends', ago: 6, expires: 90 },
    { key: 'AE7', actor: 'demo', eventType: 'review_received', subjectType: 'review', subject: 'R1', title: 'Demo received a 5-star review ⭐', subtitle: 'Vegetable Gardening', visibility: 'friends', ago: 7, expires: 90, reactions: [{ userId: U.maria, emoji: '❤️', createdAt: daysAgo(6) }] },
    { key: 'AE8', actor: 'rahim', eventType: 'level_up', subjectType: 'badge', subject: null, title: 'Rahim reached level 3 🔥', subtitle: 'Flame', visibility: 'public', ago: 8, expires: 90 },
    { key: 'AE9', actor: 'demo', eventType: 'friend_joined', subjectType: 'friendship', subject: 'F1', title: 'Demo and Maria are now friends 👥', subtitle: '', visibility: 'friends', ago: 9, expires: 90 },
    { key: 'AE10', actor: 'maria', eventType: 'joined_group_session', subjectType: 'group_session', subject: 'GS1', title: 'Maria joined a group session 📅', subtitle: 'Weekend Sourdough Workshop', visibility: 'friends', ago: 10, expires: 90 },
    { key: 'AE11', actor: 'kabir', eventType: 'review_received', subjectType: 'review', subject: 'R18', title: 'Kabir received a review ⭐', subtitle: 'Baking', visibility: 'public', ago: 11, expires: 90 },
    { key: 'AE12', actor: 'demo', eventType: 'journal_highlight', subjectType: 'journal_highlight', subject: null, title: 'Demo highlighted a journal entry 📖', subtitle: 'Gardening', visibility: 'friends', ago: 12, expires: 90 },
    { key: 'AE13', actor: 'noah', eventType: 'session_learned', subjectType: 'connection', subject: 'C17', title: 'Noah learned a session 🎯', subtitle: 'Composting', visibility: 'friends', ago: 13, expires: 90 },
    { key: 'AE14', actor: 'demo', eventType: 'challenge_completed', subjectType: 'challenge', subject: 'CH3', title: 'Demo completed a challenge 🏆', subtitle: 'Gardening Week', visibility: 'friends', ago: 14, expires: 90 },
    { key: 'AE15', actor: 'demo', eventType: 'skill_swap_accepted', subjectType: 'swap', subject: 'SW2', title: 'Demo accepted a skill swap 🔀', subtitle: 'Smartphone Basics', visibility: 'friends', ago: 15, expires: 90 },
    { key: 'AE16', actor: 'maria', eventType: 'session_taught', subjectType: 'connection', subject: 'C29', title: 'Maria taught a session 🧑‍🏫', subtitle: 'Baking', visibility: 'public', ago: 16, expires: 90 },
    { key: 'AE17', actor: 'demo', eventType: 'streak_milestone', subjectType: 'streak', subject: null, title: 'Demo hit a 14-day streak 🔥', subtitle: 'Teaching', visibility: 'friends', ago: 17, expires: 90 },
    { key: 'AE18', actor: 'noah', eventType: 'friend_request_accepted', subjectType: 'friendship', subject: 'F5', title: 'Noah accepted a friend request 👥', subtitle: '', visibility: 'friends', ago: 18, expires: 90 },
    { key: 'AE19', actor: 'fatima', eventType: 'session_completed', subjectType: 'connection', subject: 'C4', title: 'Fatima completed a session 🎓', subtitle: 'Vegetable Gardening', visibility: 'public', ago: 19, expires: 90 },
    { key: 'AE20', actor: 'demo', eventType: 'skill_added', subjectType: 'skill', subject: 'DEMO_BAKE', title: 'Demo added a skill: Baking Basics 🧑‍🏫', subtitle: 'Food & Cooking', visibility: 'public', ago: 20, expires: 90 },
  ];
  for (const input of aeInputs) {
    AE[input.key] = OID();
    let subjectId: Types.ObjectId | undefined;
    if (input.subject) {
      subjectId = C[input.subject] ?? S[input.subject] ?? GS[input.subject] ?? F[input.subject] ?? SW[input.subject] ?? CH[input.subject] ?? R[input.subject] ?? undefined;
    }
    const createdAt = daysAgo(input.ago);
    await ActivityEvent.create({
      _id: AE[input.key],
      actorId: U[input.actor],
      eventType: input.eventType,
      subjectType: input.subjectType,
      subjectId,
      preview: { title: input.title, subtitle: input.subtitle },
      visibility: input.visibility,
      reactions: input.reactions ?? [],
      commentCount: input.commentCount ?? 0,
      expiresAt: new Date(createdAt.getTime() + input.expires * D),
      createdAt,
    });
  }

  console.log('\n== Seeding streaks ==');
  const streakInputs: any[] = [
    { user: 'demo', type: 'teaching', current: 8, longest: 14, last: daysAgo(1), start: daysAgo(8), milestones: [7] },
    { user: 'demo', type: 'learning', current: 23, longest: 30, last: daysAgo(0), start: daysAgo(23), milestones: [7, 14] },
    { user: 'demo', type: 'logging', current: 5, longest: 9, last: daysAgo(0), start: daysAgo(5), milestones: [], freezesUsed: 1, freezesAvailable: 2 },
    { user: 'kabir', type: 'teaching', current: 12, longest: 12, last: daysAgo(0), start: daysAgo(12), milestones: [7] },
    { user: 'maria', type: 'learning', current: 30, longest: 30, last: daysAgo(0), start: daysAgo(30), milestones: [7, 14, 30] },
    { user: 'rahim', type: 'teaching', current: 6, longest: 10, last: daysAgo(1), start: daysAgo(6), milestones: [7] },
    { user: 'noah', type: 'learning', current: 4, longest: 7, last: daysAgo(2), start: daysAgo(4), milestones: [] },
    { user: 'gen1', type: 'learning', current: 3, longest: 3, last: daysAgo(0), start: daysAgo(3), milestones: [] },
    { user: 'fatima', type: 'teaching', current: 2, longest: 5, last: daysAgo(3), start: daysAgo(2), milestones: [] },
  ];
  for (const input of streakInputs) {
    await Streak.create({
      userId: U[input.user],
      type: input.type,
      currentStreak: input.current,
      longestStreak: input.longest,
      lastActivityDate: input.last,
      streakStartDate: input.start,
      freezesUsed: input.freezesUsed ?? 0,
      freezesAvailable: input.freezesAvailable ?? 1,
      milestones: input.milestones,
    });
  }

  console.log('\n== Seeding direct messages ==');
  await DirectMessage.create([
    { senderId: U.kabir, recipientId: U.demo, content: 'Hey! Ready for our baking session tomorrow?', readAt: daysAgo(1) },
    { senderId: U.demo, recipientId: U.kabir, content: 'Absolutely! Bring your starter.', readAt: daysAgo(1) },
    { senderId: U.kabir, recipientId: U.demo, content: 'See you at 10.', readAt: undefined },
    { senderId: U.maria, recipientId: U.demo, content: 'Thanks for the phone tips today!', readAt: daysAgo(1) },
    { senderId: U.demo, recipientId: U.maria, content: 'Anytime! Let me know if you need more help.', readAt: daysAgo(1) },
    { senderId: U.maria, recipientId: U.demo, content: 'Will do. Talk soon!', readAt: undefined },
    { senderId: U.rahim, recipientId: U.demo, content: 'Got the plumbing book you mentioned.', readAt: daysAgo(2) },
    { senderId: U.nyc, recipientId: U.demo, content: 'Excited to trade knitting tips!', readAt: undefined },
    { senderId: U.gen1, recipientId: U.gen2, content: 'See you at the group session.', readAt: daysAgo(1) },
  ]);

  console.log('\n== Seeding skill journals ==');
  await SkillJournal.create([
    { userId: U.demo, connectionId: C.C4, prompt: 'What did you learn today?', content: 'Learned the right soil mix for container tomatoes. Fatima asked great questions!', mood: 5, isHighlighted: true },
    { userId: U.demo, connectionId: C.C9, prompt: 'What went well?', content: 'Sourdough starter came alive during our session.', mood: 4, isHighlighted: false },
    { userId: U.demo, connectionId: C.C16, prompt: 'Biggest takeaway?', content: 'Replacing a tap washer is easy once you turn off the water first!', mood: 5, isHighlighted: true },
    { userId: U.kabir, connectionId: C.C2, prompt: 'How did it go?', content: 'Shaping practice went well.', mood: 4, isHighlighted: false },
    { userId: U.noah, connectionId: C.C17, prompt: 'Reflection', content: 'Demo built the bin perfectly.', mood: 5, isHighlighted: false },
  ]);

  console.log('\n== Seeding request templates ==');
  await RequestTemplate.create([
    { title: 'Learn a Kitchen Skill', intro: "Hi! I'd love to learn cooking from you.", body: "I'm a complete beginner and would love to book a session. Are you free on weekends?", categoryId: catBySlug.get('food-cooking')!._id, categoryName: 'Food & Cooking', isActive: true, createdBy: U.admin },
    { title: 'Gardening Help', intro: 'Hello! My balcony garden needs help.', body: 'Would you be able to show me how to care for my tomato plants?', categoryId: catBySlug.get('home-garden')!._id, categoryName: 'Home & Garden', isActive: true, createdBy: U.admin },
    { title: 'Smartphone Coaching', intro: 'Hi there, I need phone help.', body: 'I struggle with apps and photos. Can you help?', categoryId: catBySlug.get('digital-literacy')!._id, categoryName: 'Digital Literacy', isActive: true, createdBy: U.admin },
    { title: 'Sewing Introduction', intro: 'Old inactive template.', body: 'This template is no longer used.', categoryId: catBySlug.get('textile-craft')!._id, categoryName: 'Textile & Craft', isActive: false, createdBy: U.admin },
  ]);

  console.log('\n== Done ==');
  await disconnectDatabase();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
