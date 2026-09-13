import 'dotenv/config';
import * as dns from 'node:dns';
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
  SkillRadar,
  SwapReadyMatch,
  SkillDemandSnapshot,
  ConversationSettings,
  UserInboxPreference,
} from '../models';

// The machine's default DNS resolver can be flaky; prefer public resolvers
// so the Atlas SRV records always resolve.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const H = 3600 * 1000;
const D = 24 * H;
const daysAgo = (n: number) => new Date(Date.now() - n * D);
const daysFromNow = (n: number) => new Date(Date.now() + n * D);
const OID = () => new Types.ObjectId();

const KEEP_EMAILS = [
  'partoftech150@gmail.com',
  'simoksimon147@gmail.com',
  'freedrob32@gmail.com',
  'himonchalse@gmail.com',
  'arnobmojumder935@gmail.com',
  'zishan@gmail.com',
];

// ─── User personas (keys map to the six production accounts) ───────────────
const EMAILS = {
  kabir: 'simoksimon147@gmail.com',
  abir: 'partoftech150@gmail.com',
  zishan: 'zishan@gmail.com',
  fahim: 'freedrob32@gmail.com',
  rakib: 'himonchalse@gmail.com',
  arnob: 'arnobmojumder935@gmail.com',
} as const;
type UKey = keyof typeof EMAILS;

const LOCS = {
  gulshan: { city: 'dhaka', zipCode: '1212', neighborhood: 'Gulshan', type: 'Point' as const, coordinates: [90.4135, 23.7933] as [number, number], radiusPreference: 15 },
  banani: { city: 'dhaka', zipCode: '1213', neighborhood: 'Banani', type: 'Point' as const, coordinates: [90.4092, 23.785] as [number, number], radiusPreference: 15 },
  dhanmondi: { city: 'dhaka', zipCode: '1209', neighborhood: 'Dhanmondi', type: 'Point' as const, coordinates: [90.375, 23.7461] as [number, number], radiusPreference: 12 },
  uttara: { city: 'dhaka', zipCode: '1230', neighborhood: 'Uttara', type: 'Point' as const, coordinates: [90.407, 23.8755] as [number, number], radiusPreference: 18 },
  mirpur: { city: 'dhaka', zipCode: '1216', neighborhood: 'Mirpur', type: 'Point' as const, coordinates: [90.3661, 23.8089] as [number, number], radiusPreference: 12 },
  motijheel: { city: 'dhaka', zipCode: '1000', neighborhood: 'Motijheel', type: 'Point' as const, coordinates: [90.4175, 23.733] as [number, number], radiusPreference: 10 },
};

const EVENINGS = [
  { day: 'wednesday', startTime: '18:00', endTime: '21:00' },
  { day: 'thursday', startTime: '18:00', endTime: '21:00' },
  { day: 'sunday', startTime: '10:00', endTime: '14:00' },
];
const MORNINGS = [
  { day: 'monday', startTime: '09:00', endTime: '12:00' },
  { day: 'friday', startTime: '09:00', endTime: '11:00' },
  { day: 'saturday', startTime: '10:00', endTime: '13:00' },
];
const FLEXIBLE = [
  { day: 'tuesday', startTime: '16:00', endTime: '19:00' },
  { day: 'thursday', startTime: '17:00', endTime: '20:00' },
  { day: 'sunday', startTime: '11:00', endTime: '15:00' },
];

let U: Record<UKey, Types.ObjectId>;
let CAT: Record<string, Types.ObjectId>;

function canonicalPair(a: string, b: string): { a: string; b: string } {
  return a < b ? { a, b } : { a: b, b: a };
}

async function findUser(email: string): Promise<Types.ObjectId> {
  const user = await User.findOne({ email }).select('_id').lean();
  if (!user) throw new Error(`Production user not found in DB: ${email}`);
  return user._id;
}

async function findCategoryId(slug: string): Promise<{ _id: Types.ObjectId; name: string }> {
  const cat = await Category.findOne({ slug }).lean();
  if (!cat) throw new Error(`Missing category: ${slug}`);
  return { _id: cat._id, name: cat.name };
}

// ─── COLLECTIONS THAT GET FULLY REBUILT (deleted + reseeded) ───────────────
const REBUILD_COLLECTIONS = [
  'activityevents', 'apikeys', 'auditlogs', 'blockoutdates', 'blocks',
  'botinstallations', 'calendarintegrations', 'challenges', 'communityposts',
  'connections', 'conversationsettings', 'courseenrollments', 'courses',
  'directmessages', 'emailverificationtokens', 'endorsements', 'friendships',
  'groupsessions', 'learnerrequests', 'mentorships', 'messages',
  'notifications', 'oauthproviders', 'passwordresettokens', 'refreshtokens',
  'reports', 'requesttemplates', 'reviews', 'savedsearches', 'sessionnotes',
  'showcases', 'skillbundles', 'skilldemandsnapshots', 'skilljournals',
  'skillradars', 'skills', 'skillsuggestions', 'skillswaps', 'streaks',
  'swapreadymatches', 'tips', 'tokenblacklists', 'twofactorsecrets',
  'userinboxpreferences', 'webhooks',
];

const SRV_HOST = '_mongodb._tcp.cluster0.rpah2jy.mongodb.net';
const SRV_BASE = 'cluster0.rpah2jy.mongodb.net';

async function resolveWithFreshResolver(type: 'Srv' | 'Txt', name: string): Promise<any[]> {
  const resolvers = ['8.8.8.8', '1.1.1.1'];
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const resolver = new dns.Resolver();
    resolver.setServers(resolvers);
    try {
      const records = await new Promise<any[]>((resolve, reject) => {
        const cb = (err: unknown, rec: any) => (err ? reject(err) : resolve(rec));
        if (type === 'Srv') resolver.resolveSrv(name, cb);
        else resolver.resolveTxt(name, cb);
      });
      return records;
    } catch (e: any) {
      lastErr = e;
      console.log(`DNS ${type} ${name} attempt ${attempt + 1} FAIL: ${e.code} ${e.message}`);
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error(`DNS ${type} ${name} failed: ${(lastErr as any)?.message}`);
}

function buildDirectUri(credentials: string, hosts: dns.SrvRecord[], txtOptions: string, dbName: string): string {
  const optionPairs = new Map<string, string>();
  for (const part of txtOptions.split('&')) {
    const [k, v] = part.split('=');
    if (k && v) optionPairs.set(k, v);
  }
  const replicaSet = optionPairs.get('replicaSet') ?? '';
  const authSource = optionPairs.get('authSource') ?? 'admin';
  const hostsPart = hosts.map((h) => `${h.name}:${h.port}`).join(',');
  const params = new URLSearchParams({
    tls: 'true',
    authSource,
    serverSelectionTimeoutMS: '5000',
    socketTimeoutMS: '45000',
    maxPoolSize: '10',
  });
  if (replicaSet) params.set('replicaSet', replicaSet);
  return `mongodb://${credentials}@${hostsPart}/${dbName}?${params.toString()}`;
}

async function connectDirect(): Promise<void> {
  const srv = await resolveWithFreshResolver('Srv', SRV_HOST);
  if (!Array.isArray(srv) || srv.length === 0) throw new Error('SRV returned no records');
  const hosts = srv.map((r) => ({ name: r.name, port: r.port }));
  const txt = await resolveWithFreshResolver('Txt', SRV_BASE);
  const txtOptions = (txt.flat() ?? []).join('&');
  const rawMongoUri = process.env.MONGODB_URI || '';
  const atIndex = rawMongoUri.indexOf('@');
  const credentials = rawMongoUri.slice(rawMongoUri.indexOf('//') + 2, atIndex);
  const dbName = rawMongoUri.split('@').pop()?.split('/')[1]?.split('?')[0] ?? 'the-skill-hearth';
  const directUri = buildDirectUri(credentials, hosts, txtOptions, dbName);
  console.log(`Connecting direct to db: ${dbName}`);
  const mongoose = (await import('mongoose')).default;
  await mongoose.connect(directUri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 });
  console.log(`MongoDB connected (direct): ${mongoose.connection.host} / ${mongoose.connection.name}`);
}

async function main(): Promise<void> {
  await connectDirect();
  const mongoose = (await import('mongoose')).default;

  console.log('\n== Ensuring categories ==');
  await seedCategories();
  const cPhoto = await findCategoryId('photography-visual');
  const cTech = await findCategoryId('technology-web');
  const cMusic = await findCategoryId('music-arts');
  const cLang = await findCategoryId('languages-communication');
  const cFood = await findCategoryId('food-cooking');
  const cGarden = await findCategoryId('home-garden');
  const cCraft = await findCategoryId('textile-craft');
  const cDigital = await findCategoryId('digital-literacy');
  CAT = {
    photo: cPhoto._id, tech: cTech._id, music: cMusic._id, lang: cLang._id,
    food: cFood._id, garden: cGarden._id, craft: cCraft._id, digital: cDigital._id,
  };
  const categories = await Category.find({ isActive: true }).lean();
  console.log(`  ${categories.length} categories ready`);

  console.log('\n== Resolving the six production users ==');
  U = {
    kabir: await findUser(EMAILS.kabir),
    abir: await findUser(EMAILS.abir),
    zishan: await findUser(EMAILS.zishan),
    fahim: await findUser(EMAILS.fahim),
    rakib: await findUser(EMAILS.rakib),
    arnob: await findUser(EMAILS.arnob),
  };
  for (const [k, v] of Object.entries(U)) console.log(`  ${k}: ${v}`);

  // ─── CLEANUP ──────────────────────────────────────────────────────────────
  console.log('\n== Cleaning: drop data that does not belong to the six users ==');
  const keepIds = Object.values(U);
  const deletedUsers = await User.deleteMany({ _id: { $nin: keepIds } });
  console.log(`  removed ${deletedUsers.deletedCount} non-production users`);
  for (const name of REBUILD_COLLECTIONS) {
    const result = await mongoose.connection.db.collection(name).deleteMany({});
    console.log(`  cleared ${name} (${result.deletedCount})`);
  }
  // migrationlogs are intentionally preserved: the seeded skill radars and
  // saved searches are already in post-migration shape, so the corresponding
  // migration records must keep marking those migrations as "already run".

  // ─── ENRICH THE SIX PROFILES ──────────────────────────────────────────────
  console.log('\n== Enriching the six profiles ==');
  const profileDefs: Array<{
    key: UKey; name: string; bio: string; loc: typeof LOCS.gulshan; avail: typeof EVENINGS;
    xp: number; badges: string[]; feedVisibility: 'public' | 'friends' | 'close_friends' | 'private';
    digest: boolean; quiet: boolean; friendIds: UKey[]; closeFriendIds: UKey[];
  }> = [
    {
      key: 'kabir', name: 'Kabir Hossain',
      bio: 'Photographer and JavaScript developer. I lead the Skill Hearth community team and love swapping skills with neighbours, especially around Gulshan.',
      loc: LOCS.gulshan, avail: EVENINGS, xp: 1800,
      badges: ['first_spark', 'full_profile', 'ready_to_share', 'first_session', 'first_friend', 'skill_swapper', 'five_star_debut', 'multi_skill', 'early_adopter', 'streak_7', 'streak_30', 'ten_sessions', 'local_legend'],
      feedVisibility: 'friends', digest: true, quiet: false,
      friendIds: ['abir', 'zishan', 'fahim', 'arnob'], closeFriendIds: ['abir'],
    },
    {
      key: 'abir', name: 'Abir Rahman',
      bio: 'Spanish teacher, guitarist and photography enthusiast. Currently learning JavaScript. Always happy to trade a language lesson for a coding lesson!',
      loc: LOCS.banani, avail: EVENINGS, xp: 1400,
      badges: ['first_spark', 'full_profile', 'ready_to_share', 'first_session', 'first_friend', 'skill_swapper', 'five_star_debut', 'early_adopter', 'streak_7', 'ten_sessions'],
      feedVisibility: 'public' as const, digest: true, quiet: false,
      friendIds: ['kabir', 'zishan', 'fahim'], closeFriendIds: ['kabir'],
    },
    {
      key: 'zishan', name: 'Zishan Ahmed',
      bio: 'Home cook and mindfulness coach. I teach Mediterranean-style cooking and lead guided meditation sessions from my home in Dhanmondi.',
      loc: LOCS.dhanmondi, avail: FLEXIBLE, xp: 950,
      badges: ['first_spark', 'full_profile', 'ready_to_share', 'first_session', 'first_friend', 'skill_swapper', 'five_star_debut', 'early_adopter', 'streak_7'],
      feedVisibility: 'friends', digest: true, quiet: true,
      friendIds: ['kabir', 'abir', 'rakib', 'fahim', 'arnob'], closeFriendIds: [],
    },
    {
      key: 'fahim', name: 'Fahim Chowdhury',
      bio: 'Yoga instructor and digital-literacy mentor living in Uttara. I help seniors and neighbours get comfortable with smartphones and online safety.',
      loc: LOCS.uttara, avail: MORNINGS, xp: 600,
      badges: ['first_spark', 'full_profile', 'first_session', 'first_friend', 'early_adopter'],
      feedVisibility: 'friends', digest: true, quiet: false,
      friendIds: ['kabir', 'abir', 'zishan', 'rakib'], closeFriendIds: [],
    },
    {
      key: 'rakib', name: 'Rakib Hasan',
      bio: 'Digital literacy trainer and amateur English tutor from Mirpur. I run sewing workshops and help students get started with coding basics.',
      loc: LOCS.mirpur, avail: EVENINGS, xp: 400,
      badges: ['first_spark', 'full_profile', 'first_session', 'first_friend'],
      feedVisibility: 'friends', digest: false, quiet: false,
      friendIds: ['zishan', 'fahim', 'arnob'], closeFriendIds: ['fahim'],
    },
    {
      key: 'arnob', name: 'Arnob Mojumder',
      bio: 'Web designer and home-garden enthusiast from Motijheel. I teach intuitive HTML/CSS and vegetable gardening to absolute beginners.',
      loc: LOCS.motijheel, avail: FLEXIBLE, xp: 300,
      badges: ['first_spark', 'full_profile', 'first_session', 'first_friend'],
      feedVisibility: 'public' as const, digest: true, quiet: false,
      friendIds: ['rakib', 'zishan', 'kabir'], closeFriendIds: [],
    },
  ];
  for (const def of profileDefs) {
    const level = getLevelForXp(def.xp);
    await User.updateOne({ _id: U[def.key] }, { $set: {
      displayName: def.name, bio: def.bio, location: def.loc,
      availability: def.avail, showOnMap: true,
      stats: { sessionsCompleted: 0, averageRating: 0, reviewCount: 0 },
      gamification: { xp: def.xp, level: level.level, badges: def.badges, streakFreezeAvailable: 2, referralCode: `SH-${String(U[def.key]).slice(-6).toUpperCase()}` },
      friendIds: def.friendIds.map((k) => U[k]),
      closeFriendIds: def.closeFriendIds.map((k) => U[k]),
      feedVisibility: def.feedVisibility, weeklyDigest: def.digest,
      quietHours: { enabled: def.quiet, startTime: '22:00', endTime: '07:00', timezone: 'Asia/Dhaka' },
    }});
    console.log(`  profile: ${def.key}`);
  }

  // ─── SKILLS ───────────────────────────────────────────────────────────────
  console.log('\n== Seeding skills ==');
  const S: Record<string, Types.ObjectId> = {};
  const skillDefs: any[] = [
    { key: 'K_PHOTO', user: 'kabir', type: 'teach', cat: 'photo', name: 'Photography', desc: 'Composition, natural light, and the rule of thirds. Street and portrait photography in Gulshan.', prof: 'advanced', format: 'in-person', len: '1hr', stats: { averageRating: 5, reviewCount: 3, completedSessionCount: 3 } },
    { key: 'K_JS', user: 'kabir', type: 'teach', cat: 'tech', name: 'JavaScript', desc: 'Web development fundamentals from variables to building interactive pages.', prof: 'advanced', format: 'online', len: '2hr+', stats: { averageRating: 0, reviewCount: 0, completedSessionCount: 0 } },
    { key: 'K_SPANISH', user: 'kabir', type: 'learn', cat: 'lang', name: 'Spanish', desc: 'Want to hold a real conversation in Spanish before a summer trip to Spain.', prof: 'beginner', format: 'in-person', len: '1hr' },
    { key: 'K_GUITAR', user: 'kabir', type: 'learn', cat: 'music', name: 'Guitar', desc: 'Want to learn acoustic guitar from zero for family sing-alongs.', prof: 'beginner', format: 'in-person', len: '1hr' },
    { key: 'K_COOK', user: 'kabir', type: 'learn', cat: 'food', name: 'Healthy Cooking', desc: 'Learning Mediterranean-style meal prep to eat better during the work week.', prof: 'beginner', format: 'in-person', len: '2hr+' },

    { key: 'A_PHOTO', user: 'abir', type: 'teach', cat: 'photo', name: 'Photography', desc: 'Shoot with confidence, understand light and composition, edit like a pro.', prof: 'intermediate', format: 'in-person', len: '1hr', stats: { averageRating: 0, reviewCount: 0, completedSessionCount: 0 } },
    { key: 'A_SPANISH', user: 'abir', type: 'teach', cat: 'lang', name: 'Spanish', desc: 'Conversational Spanish for everyday life. We practise speaking from day one.', prof: 'intermediate', format: 'in-person', len: '1hr', stats: { averageRating: 4.5, reviewCount: 2, completedSessionCount: 2 } },
    { key: 'A_GUITAR', user: 'abir', type: 'teach', cat: 'music', name: 'Guitar', desc: 'Acoustic guitar basics: chords, strumming and your first songs.', prof: 'intermediate', format: 'in-person', len: '1hr', stats: { averageRating: 5, reviewCount: 1, completedSessionCount: 1 } },
    { key: 'A_JS', user: 'abir', type: 'learn', cat: 'tech', name: 'JavaScript', desc: 'Want to learn JavaScript and build my own small web projects.', prof: 'beginner', format: 'online', len: '2hr+' },
    { key: 'A_COOK', user: 'abir', type: 'learn', cat: 'food', name: 'Healthy Cooking', desc: 'Learning to meal-prep healthy lunches for the working week.', prof: 'beginner', format: 'either', len: '2hr+' },

    { key: 'Z_COOK', user: 'zishan', type: 'teach', cat: 'food', name: 'Healthy Cooking', desc: 'Mediterranean and plant-based meal prep, plus tips for feeding a family well.', prof: 'intermediate', format: 'in-person', len: '2hr+', stats: { averageRating: 5, reviewCount: 1, completedSessionCount: 1 } },
    { key: 'Z_MEDITATE', user: 'zishan', type: 'teach', cat: 'music', name: 'Meditation', desc: 'Guided meditation and mindfulness for stress relief and deep focus.', prof: 'intermediate', format: 'online', len: '1hr', stats: { averageRating: 5, reviewCount: 1, completedSessionCount: 1 } },
    { key: 'Z_PHOTO', user: 'zishan', type: 'learn', cat: 'photo', name: 'Photography', desc: 'Want to take better food photos for my cooking blog.', prof: 'beginner', format: 'in-person', len: '1hr' },
    { key: 'Z_GUITAR', user: 'zishan', type: 'learn', cat: 'music', name: 'Guitar', desc: 'Want to accompany myself singing a few campfire songs.', prof: 'beginner', format: 'in-person', len: '1hr' },
    { key: 'Z_JS', user: 'zishan', type: 'learn', cat: 'tech', name: 'JavaScript', desc: 'Curious about coding - want to learn the basics to build a simple recipe app.', prof: 'beginner', format: 'online', len: '2hr+' },

    { key: 'F_YOGA', user: 'fahim', type: 'teach', cat: 'music', name: 'Yoga & Stretching', desc: 'Beginner-friendly yoga, mobility and stretching to stay active and pain-free.', prof: 'intermediate', format: 'in-person', len: '1hr', stats: { averageRating: 0, reviewCount: 0, completedSessionCount: 0 } },
    { key: 'F_DIGITAL', user: 'fahim', type: 'teach', cat: 'digital', name: 'Smartphone Basics', desc: 'Apps, photos, settings and staying safe online - perfect for beginners.', prof: 'intermediate', format: 'in-person', len: '1hr', stats: { averageRating: 0, reviewCount: 0, completedSessionCount: 0 } },
    { key: 'F_COOK', user: 'fahim', type: 'learn', cat: 'food', name: 'Healthy Cooking', desc: 'Want to cook healthier food for my family on a budget.', prof: 'beginner', format: 'in-person', len: '2hr+' },
    { key: 'F_PHOTO', user: 'fahim', type: 'learn', cat: 'photo', name: 'Photography', desc: 'Want to take better photos of my kids and travels.', prof: 'beginner', format: 'either', len: '1hr' },
    { key: 'F_ENGLISH', user: 'fahim', type: 'learn', cat: 'lang', name: 'English Conversation', desc: 'Want to practise conversational English for work calls.', prof: 'intermediate', format: 'online', len: '1hr' },

    { key: 'R_DIGITAL', user: 'rakib', type: 'teach', cat: 'digital', name: 'Digital Literacy', desc: 'Email, video calls, online safety and getting comfortable with technology.', prof: 'advanced', format: 'in-person', len: '1hr', stats: { averageRating: 4.5, reviewCount: 2, completedSessionCount: 2 } },
    { key: 'R_ENGLISH', user: 'rakib', type: 'teach', cat: 'lang', name: 'English Conversation', desc: 'Everyday spoken English: confidence, pronunciation and useful phrases.', prof: 'intermediate', format: 'in-person', len: '1hr', stats: { averageRating: 5, reviewCount: 1, completedSessionCount: 1 } },
    { key: 'R_SEW', user: 'rakib', type: 'teach', cat: 'craft', name: 'Sewing & Mending', desc: 'Hand and machine sewing, repairs, alterations and simple garments.', prof: 'intermediate', format: 'in-person', len: '2hr+', stats: { averageRating: 0, reviewCount: 0, completedSessionCount: 0 } },
    { key: 'R_COOK', user: 'rakib', type: 'learn', cat: 'food', name: 'Healthy Cooking', desc: 'Want to learn quick, healthy weekday recipes.', prof: 'beginner', format: 'in-person', len: '2hr+' },
    { key: 'R_YOGA', user: 'rakib', type: 'learn', cat: 'music', name: 'Yoga & Stretching', desc: 'Looking for gentle morning stretching to reduce back pain.', prof: 'beginner', format: 'in-person', len: '1hr' },
    { key: 'R_JS', user: 'rakib', type: 'learn', cat: 'tech', name: 'JavaScript', desc: 'Want to understand the basics of programming.', prof: 'beginner', format: 'online', len: '2hr+' },

    { key: 'ARN_WEB', user: 'arnob', type: 'teach', cat: 'tech', name: 'Web Design', desc: 'Intuitive HTML & CSS for absolute beginners - build your first page.', prof: 'advanced', format: 'online', len: '2hr+', stats: { averageRating: 0, reviewCount: 0, completedSessionCount: 0 } },
    { key: 'ARN_GARDEN', user: 'arnob', type: 'teach', cat: 'garden', name: 'Vegetable Gardening', desc: 'Grow tomatoes, chilli and leafy greens in pots on a balcony or rooftop.', prof: 'intermediate', format: 'in-person', len: '1hr', stats: { averageRating: 0, reviewCount: 0, completedSessionCount: 0 } },
    { key: 'ARN_SPANISH', user: 'arnob', type: 'learn', cat: 'lang', name: 'Spanish', desc: 'Beginner Spanish for travel - want to get conversational.', prof: 'beginner', format: 'in-person', len: '1hr' },
    { key: 'ARN_GUITAR', user: 'arnob', type: 'learn', cat: 'music', name: 'Guitar', desc: 'Always wanted to play guitar - total beginner.', prof: 'beginner', format: 'in-person', len: '1hr' },
    { key: 'ARN_COOK', user: 'arnob', type: 'learn', cat: 'food', name: 'Healthy Cooking', desc: 'Want to move beyond instant noodles and cook real meals.', prof: 'beginner', format: 'either', len: '2hr+' },
    { key: 'ARN_YOGA', user: 'arnob', type: 'learn', cat: 'music', name: 'Yoga & Stretching', desc: 'Want to improve posture and flexibility after long hours at the desk.', prof: 'beginner', format: 'in-person', len: '1hr' },
  ];
  for (const def of skillDefs) {
    const id = OID();
    S[def.key] = id;
    const locFor = (user: UKey) => ({
      city: 'dhaka',
      zipCode: LOCS[user === 'kabir' ? 'gulshan' : user === 'abir' ? 'banani' : user === 'zishan' ? 'dhanmondi' : user === 'fahim' ? 'uttara' : user === 'rakib' ? 'mirpur' : 'motijheel'].zipCode,
      neighborhood: LOCS[user === 'kabir' ? 'gulshan' : user === 'abir' ? 'banani' : user === 'zishan' ? 'dhanmondi' : user === 'fahim' ? 'uttara' : user === 'rakib' ? 'mirpur' : 'motijheel'].neighborhood,
      type: 'Point' as const,
      coordinates: LOCS[user === 'kabir' ? 'gulshan' : user === 'abir' ? 'banani' : user === 'zishan' ? 'dhanmondi' : user === 'fahim' ? 'uttara' : user === 'rakib' ? 'mirpur' : 'motijheel'].coordinates,
      radiusPreference: LOCS[user === 'kabir' ? 'gulshan' : user === 'abir' ? 'banani' : user === 'zishan' ? 'dhanmondi' : user === 'fahim' ? 'uttara' : user === 'rakib' ? 'mirpur' : 'motijheel'].radiusPreference,
    });
    await Skill.create({
      _id: id, userId: U[def.user], type: def.type, categoryId: CAT[def.cat], categoryName: categories.find((c) => c._id.equals(CAT[def.cat]))!.name,
      skillName: def.name, description: def.desc, proficiencyLevel: def.prof, format: def.format,
      sessionLength: def.len, isActive: true, isDeleted: false, showOnMap: true, media: [],
      location: locFor(def.user), stats: def.stats ?? { averageRating: 0, reviewCount: 0, completedSessionCount: 0 },
    });
  }
  console.log(`  ${skillDefs.length} skills`);

  // ─── CONNECTIONS ──────────────────────────────────────────────────────────
  console.log('\n== Seeding connections ==');
  const C: Record<string, Types.ObjectId> = {};
  const connInputs: any[] = [
    { key: 'AB_KA_1', requester: 'abir', teacher: 'kabir', skill: 'K_PHOTO', status: 'completed', message: 'I would love to learn photography from you!', responseMessage: 'Great - bring your camera and we will start with the basics.', proposedFormat: 'in-person', completedAt: daysAgo(14), createdAt: daysAgo(21) },
    { key: 'KA_AB_1', requester: 'kabir', teacher: 'abir', skill: 'A_SPANISH', status: 'completed', message: 'I want to learn conversational Spanish.', responseMessage: 'Perfect, we will start with greetings and ordering food.', proposedFormat: 'in-person', completedAt: daysAgo(9), createdAt: daysAgo(16) },
    { key: 'KA_AB_2', requester: 'kabir', teacher: 'abir', skill: 'A_GUITAR', status: 'accepted', message: 'I have always wanted to play guitar!', responseMessage: 'Absolutely! Bring any guitar you have.', proposedFormat: 'in-person', createdAt: daysAgo(4) },
    { key: 'AB_KA_2', requester: 'abir', teacher: 'kabir', skill: 'K_JS', status: 'accepted', message: 'I want to learn JavaScript for my projects.', responseMessage: 'We can meet online - I will send a CodePen link.', proposedFormat: 'online', createdAt: daysAgo(2) },
    { key: 'ZI_KA_1', requester: 'zishan', teacher: 'kabir', skill: 'K_PHOTO', status: 'completed', message: 'I want to take better food photos for my blog.', responseMessage: 'Happy to help! Natural light is your best friend.', proposedFormat: 'in-person', completedAt: daysAgo(8), createdAt: daysAgo(13) },
    { key: 'KA_ZI_1', requester: 'kabir', teacher: 'zishan', skill: 'Z_COOK', status: 'completed', message: 'Teach me Mediterranean meal prep!', responseMessage: 'Let us start with a big pot of chickpea stew.', proposedFormat: 'in-person', completedAt: daysAgo(5), createdAt: daysAgo(10) },
    { key: 'KA_ZI_2', requester: 'kabir', teacher: 'zishan', skill: 'Z_MEDITATE', status: 'accepted', message: 'I want to try guided meditation for focus.', responseMessage: 'Great - we start with 10 minutes of breathing.', proposedFormat: 'online', createdAt: daysAgo(1) },
    { key: 'ZI_AB_1', requester: 'zishan', teacher: 'abir', skill: 'A_SPANISH', status: 'completed', message: 'Spanish for my cooking blog followers!', responseMessage: 'Fun! We will do role-plays at the cafe.', proposedFormat: 'in-person', completedAt: daysAgo(6), createdAt: daysAgo(12) },
    { key: 'ZI_AB_2', requester: 'zishan', teacher: 'abir', skill: 'A_GUITAR', status: 'completed', message: 'I want to learn a few chords for campfire songs.', responseMessage: 'We will start with G, C and Em.', proposedFormat: 'in-person', completedAt: daysAgo(3), createdAt: daysAgo(7) },
    { key: 'AB_ZI_1', requester: 'abir', teacher: 'zishan', skill: 'Z_MEDITATE', status: 'completed', message: 'Meditation for coding focus?', responseMessage: 'Absolutely - a 10-minute guided body scan.', proposedFormat: 'online', completedAt: daysAgo(2), createdAt: daysAgo(6) },
    { key: 'FA_KA_1', requester: 'fahim', teacher: 'kabir', skill: 'K_PHOTO', status: 'completed', message: 'Want to photograph my kids better.', responseMessage: 'Let us cover composition and catching the moment.', proposedFormat: 'in-person', completedAt: daysAgo(4), createdAt: daysAgo(9) },
    { key: 'FA_ZI_1', requester: 'fahim', teacher: 'zishan', skill: 'Z_COOK', status: 'accepted', message: 'I want to cook healthier for my family.', responseMessage: 'Wonderful - bring your favourite vegetables.', proposedFormat: 'in-person', createdAt: daysAgo(3) },
    { key: 'FA_AB_1', requester: 'fahim', teacher: 'abir', skill: 'A_SPANISH', status: 'pending', message: 'I want to learn basic Spanish phrases.', proposedFormat: 'in-person', createdAt: daysAgo(1) },
    { key: 'FA_RA_1', requester: 'fahim', teacher: 'rakib', skill: 'R_ENGLISH', status: 'completed', message: 'Conversational English for client calls.', responseMessage: 'Great - we will practise common call scenarios.', proposedFormat: 'online', completedAt: daysAgo(3), createdAt: daysAgo(8) },
    { key: 'FA_RA_2', requester: 'fahim', teacher: 'rakib', skill: 'R_DIGITAL', status: 'completed', message: 'A refresher on online safety and email.', responseMessage: 'Perfect - bring your laptop and phone.', proposedFormat: 'in-person', completedAt: daysAgo(11), createdAt: daysAgo(17) },
    { key: 'RA_ZI_1', requester: 'rakib', teacher: 'zishan', skill: 'Z_COOK', status: 'accepted', message: 'Quick weekday recipes for my family.', responseMessage: 'Let us make a one-pot dinner first.', proposedFormat: 'in-person', createdAt: daysAgo(2) },
    { key: 'AR_RA_1', requester: 'arnob', teacher: 'rakib', skill: 'R_DIGITAL', status: 'completed', message: 'Help me understand secure file sharing.', responseMessage: 'Sure - we will cover backups and cloud storage.', proposedFormat: 'in-person', completedAt: daysAgo(7), createdAt: daysAgo(12) },
    { key: 'RA_AR_1', requester: 'rakib', teacher: 'arnob', skill: 'ARN_WEB', status: 'accepted', message: 'Teach me how to build a simple webpage.', responseMessage: 'Love it - we start with HTML structure.', proposedFormat: 'online', createdAt: daysAgo(1) },
    { key: 'AR_ZI_1', requester: 'arnob', teacher: 'zishan', skill: 'Z_COOK', status: 'accepted', message: 'Real meals instead of instant noodles!', responseMessage: 'We will make a one-pan rice and dal.', proposedFormat: 'either', createdAt: daysAgo(4) },
    { key: 'AR_KA_1', requester: 'arnob', teacher: 'kabir', skill: 'K_JS', status: 'accepted', message: 'I want to understand how websites work.', responseMessage: 'We will build a tiny interactive page together.', proposedFormat: 'online', createdAt: daysAgo(2) },
    { key: 'FA_ZI_2', requester: 'arnob', teacher: 'fahim', skill: 'F_YOGA', status: 'accepted', message: 'Improve posture and desk stiffness.', responseMessage: 'We will start with gentle stretches.', proposedFormat: 'in-person', createdAt: daysAgo(5) },
    { key: 'RA_FU_1', requester: 'rakib', teacher: 'fahim', skill: 'F_YOGA', status: 'pending', message: 'Morning stretching to reduce back pain.', proposedFormat: 'in-person', createdAt: daysAgo(1) },
  ];
  for (const input of connInputs) {
    C[input.key] = OID();
    await Connection.create({
      _id: C[input.key], requesterId: U[input.requester], teacherId: U[input.teacher], skillId: S[input.skill],
      status: input.status, message: input.message, responseMessage: input.responseMessage,
      proposedFormat: input.proposedFormat, completedAt: input.completedAt, createdAt: input.createdAt ?? daysAgo(5),
    });
  }
  console.log(`  ${connInputs.length} connections`);

  // ─── MESSAGES ─────────────────────────────────────────────────────────────
  console.log('\n== Seeding messages ==');
  const M: Record<string, Types.ObjectId> = {};
  const msgInputs: any[] = [
    { key: 'M1', conn: 'AB_KA_1', sender: 'abir', content: 'Hey Kabir! So excited to start learning photography.', createdAt: daysAgo(20) },
    { key: 'M2', conn: 'AB_KA_1', sender: 'kabir', content: 'Welcome aboard! Do you have a DSLR or mirrorless?', createdAt: daysAgo(20) },
    { key: 'M3', conn: 'AB_KA_1', sender: 'abir', content: 'I have a Canon M50.', createdAt: daysAgo(19) },
    { key: 'M4', conn: 'AB_KA_1', sender: 'kabir', content: 'Perfect! We will start with aperture and shutter speed this weekend.', createdAt: daysAgo(19) },
    { key: 'M5', conn: 'KA_AB_1', sender: 'kabir', content: 'Ready for our Spanish session?', createdAt: daysAgo(15) },
    { key: 'M6', conn: 'KA_AB_1', sender: 'abir', content: 'Yes, I have been practising greetings all week.', createdAt: daysAgo(15) },
    { key: 'M7', conn: 'KA_AB_1', sender: 'kabir', content: 'Awesome. Role-play at the cafe on Saturday?', createdAt: daysAgo(14) },
    { key: 'M8', conn: 'KA_AB_1', sender: 'abir', content: 'See you at 4pm!', createdAt: daysAgo(14) },
    { key: 'M9', conn: 'KA_AB_2', sender: 'kabir', content: 'I have been practising the G and C chords.', createdAt: daysAgo(3) },
    { key: 'M10', conn: 'KA_AB_2', sender: 'abir', content: 'Nice! Next we will add D and Em.', createdAt: daysAgo(3) },
    { key: 'M11', conn: 'AB_KA_2', sender: 'abir', content: 'Can we start with variables and loops?', createdAt: daysAgo(1) },
    { key: 'M12', conn: 'AB_KA_2', sender: 'kabir', content: 'Definitely - I will send you a CodePen link to play with.', createdAt: daysAgo(1) },
    { key: 'M13', conn: 'ZI_KA_1', sender: 'zishan', content: 'I want to photograph my bowls of pasta for the blog.', createdAt: daysAgo(12) },
    { key: 'M14', conn: 'ZI_KA_1', sender: 'kabir', content: 'Great goal! Natural window light and a 45-degree angle work wonders.', createdAt: daysAgo(12) },
    { key: 'M15', conn: 'KA_ZI_1', sender: 'kabir', content: 'Zishan, your chickpea stew recipe was incredible!', createdAt: daysAgo(4) },
    { key: 'M16', conn: 'KA_ZI_1', sender: 'zishan', content: 'Thanks! I will share the full recipe card with you.', createdAt: daysAgo(4) },
    { key: 'M17', conn: 'KA_ZI_2', sender: 'kabir', content: 'Tried the breathing exercise - already calmer.', createdAt: daysAgo(0) },
    { key: 'M18', conn: 'KA_ZI_2', sender: 'zishan', content: 'Keep up the 10-minute morning routine!', createdAt: daysAgo(0) },
    { key: 'M19', conn: 'ZI_AB_2', sender: 'zishan', content: 'The guitar lesson was so much fun!', createdAt: daysAgo(2) },
    { key: 'M20', conn: 'ZI_AB_2', sender: 'abir', content: 'Glad you enjoyed it! Practice those three chords daily.', createdAt: daysAgo(2) },
    { key: 'M21', conn: 'AB_ZI_1', sender: 'abir', content: 'The body scan really helped me focus before coding.', createdAt: daysAgo(1) },
    { key: 'M22', conn: 'AB_ZI_1', sender: 'zishan', content: 'Wonderful - try it again before your next feature sprint!', createdAt: daysAgo(1) },
    { key: 'M23', conn: 'FA_KA_1', sender: 'fahim', content: 'My daughter loved the portrait tips, thank you!', createdAt: daysAgo(3) },
    { key: 'M24', conn: 'FA_KA_1', sender: 'kabir', content: 'So glad to hear it - catch the light in their eyes!', createdAt: daysAgo(3) },
    { key: 'M25', conn: 'FA_RA_1', sender: 'fahim', content: 'That call script saved me in today meeting!', createdAt: daysAgo(2) },
    { key: 'M26', conn: 'FA_RA_1', sender: 'rakib', content: 'Awesome - keep rehearsing it until it feels natural.', createdAt: daysAgo(2) },
    { key: 'M27', conn: 'AR_RA_1', sender: 'arnob', content: 'The cloud backup setup is now running automatically.', createdAt: daysAgo(4) },
    { key: 'M28', conn: 'AR_RA_1', sender: 'rakib', content: 'Great work! That is real peace of mind.', createdAt: daysAgo(4) },
    { key: 'M29', conn: 'RA_AR_1', sender: 'rakib', content: 'The HTML page is live on my laptop.', createdAt: daysAgo(0) },
    { key: 'M30', conn: 'RA_AR_1', sender: 'arnob', content: 'Love it - next week we add some CSS colour!', createdAt: daysAgo(0) },
    { key: 'M31', conn: 'FA_AB_1', sender: 'fahim', content: 'Hola Abir! Is basic Spanish for travel easy to pick up?', createdAt: daysAgo(1) },
    { key: 'M32', conn: 'FA_ZI_2', sender: 'arnob', content: 'Those desk stretches are a lifesaver.', createdAt: daysAgo(4) },
    { key: 'M33', conn: 'FA_ZI_2', sender: 'fahim', content: 'Great - add them to your calendar twice a day.', createdAt: daysAgo(4) },
  ];
  for (const input of msgInputs) {
    M[input.key] = OID();
    await Message.create({
      _id: M[input.key], connectionId: C[input.conn], senderId: U[input.sender], content: input.content,
      type: 'text', reactions: [], isReported: false, isDeleted: false, createdAt: input.createdAt,
    });
  }
  // a couple of special message types + a system message + edited + unsent demo
  await Message.create([
    { _id: (M.M34 = OID()), connectionId: C.AB_KA_1, senderId: U.kabir, content: 'Photography basics for this week', type: 'skill_card', skillCardData: { skillId: S.K_PHOTO, skillName: 'Photography', teacherName: 'Kabir Hossain', teacherAvatarUrl: '', requestStatus: 'accepted' }, reactions: [], isReported: false },
    { _id: (M.M35 = OID()), connectionId: C.AB_KA_1, senderId: U.kabir, content: '', type: 'system', systemEvent: 'connection_completed', reactions: [], isReported: false },
    { _id: (M.M36 = OID()), connectionId: C.KA_AB_1, senderId: U.abir, content: 'Edited message demo', type: 'text', editedAt: daysAgo(13), editHistory: [{ content: 'Original message', editedAt: daysAgo(14) }], reactions: [{ userId: U.kabir, emoji: '👍', createdAt: daysAgo(13) }, { userId: U.zishan, emoji: '❤️', createdAt: daysAgo(13) }], isReported: false },
    { _id: (M.M37 = OID()), connectionId: C.ZI_KA_1, senderId: U.kabir, content: 'https://example.com/golden-hour.jpg', type: 'image', imageUrl: 'https://example.com/golden-hour.jpg', imageThumbnailUrl: 'https://example.com/golden-hour-thumb.jpg', imagePublicId: 'demo/golden-hour', imageWidth: 1200, imageHeight: 800, reactions: [], isReported: false },
    { _id: (M.M38 = OID()), connectionId: C.KA_AB_1, senderId: U.abir, content: 'voice note', type: 'voice_note', voiceNoteUrl: 'https://example.com/spanish-intro.ogg', voiceNoteDurationSeconds: 22, voiceNoteWaveform: [1, 2, 3, 2, 1, 4, 3, 2], reactions: [], isReported: false },
    { _id: (M.M39 = OID()), connectionId: C.FA_RA_1, senderId: U.rakib, content: 'Happy Monday!', type: 'gif', gifUrl: 'https://example.com/monday.gif', gifWidth: 320, gifHeight: 240, reactions: [], isReported: false },
    { _id: (M.M40 = OID()), connectionId: C.AB_KA_1, senderId: U.abir, content: 'This was unsent', type: 'text', unsentAt: daysAgo(18), deletedAt: daysAgo(18), deletedBy: U.abir, reactions: [], isReported: false },
  ]);
  console.log(`  ${msgInputs.length + 7} messages`);

  // ─── REVIEWS ──────────────────────────────────────────────────────────────
  console.log('\n== Seeding reviews ==');
  const R: Record<string, Types.ObjectId> = {};
  const reviewInputs: any[] = [
    { key: 'RV_AB_KA_1', conn: 'AB_KA_1', reviewer: 'abir', reviewee: 'kabir', skill: 'K_PHOTO', rating: 5, content: 'Kabir is an incredible photography teacher. He explained composition and lighting so clearly that my photos improved immediately.', tags: ['Patient teacher', 'Clear explanations', 'Enthusiastic'], wouldRecommend: true },
    { key: 'RV_KA_AB_1', conn: 'KA_AB_1', reviewer: 'kabir', reviewee: 'abir', skill: 'A_SPANISH', rating: 5, content: 'Abir makes Spanish feel easy and fun. I left confident enough to order food entirely in Spanish.', tags: ['Engaging', 'Enthusiastic'], wouldRecommend: true },
    { key: 'RV_ZI_KA_1', conn: 'ZI_KA_1', reviewer: 'zishan', reviewee: 'kabir', skill: 'K_PHOTO', rating: 5, content: 'Kabir taught me exactly how to photograph food beautifully. My cooking blog looks amazing now!', tags: ['Well-prepared', 'Patient teacher'], wouldRecommend: true },
    { key: 'RV_KA_ZI_1', conn: 'KA_ZI_1', reviewer: 'kabir', reviewee: 'zishan', skill: 'Z_COOK', rating: 5, content: 'Zishan is a wonderful cooking teacher. The chickpea stew recipe was a hit with my whole family.', tags: ['Great listener', 'Practical tips', 'Enthusiastic'], wouldRecommend: true },
    { key: 'RV_ZI_AB_1', conn: 'ZI_AB_1', reviewer: 'zishan', reviewee: 'abir', skill: 'A_SPANISH', rating: 4, content: 'Abir is patient and encouraging. The cafe role-play really helped me remember the phrases.', tags: ['Patient teacher', 'Clear explanations'], wouldRecommend: true },
    { key: 'RV_ZI_AB_2', conn: 'ZI_AB_2', reviewer: 'zishan', reviewee: 'abir', skill: 'A_GUITAR', rating: 5, content: 'Learned three chords and my first real rhythm in one session. Excellent teaching!', tags: ['Knowledgeable', 'Enthusiastic'], wouldRecommend: true },
    { key: 'RV_AB_ZI_1', conn: 'AB_ZI_1', reviewer: 'abir', reviewee: 'zishan', skill: 'Z_MEDITATE', rating: 5, content: 'The 10-minute body scan was exactly what I needed for coding focus. Very calming and clear.', tags: ['Well-prepared', 'Engaging'], wouldRecommend: true },
    { key: 'RV_FA_KA_1', conn: 'FA_KA_1', reviewer: 'fahim', reviewee: 'kabir', skill: 'K_PHOTO', rating: 5, content: 'My kids photos have never been better. Kabir is kind and gives feedback that actually sticks.', tags: ['Patient teacher', 'Practical tips'], wouldRecommend: true },
    { key: 'RV_FA_RA_1', conn: 'FA_RA_1', reviewer: 'fahim', reviewee: 'rakib', skill: 'R_ENGLISH', rating: 5, content: 'Practising real client-call scenarios helped me feel confident on my first English meeting.', tags: ['Engaging', 'Practical tips'], wouldRecommend: true },
    { key: 'RV_FA_RA_2', conn: 'FA_RA_2', reviewer: 'fahim', reviewee: 'rakib', skill: 'R_DIGITAL', rating: 5, content: 'Clear, patient and no jargon. Now I manage my own email and backups confidently.', tags: ['Clear explanations', 'Punctual'], wouldRecommend: true },
    { key: 'RV_AR_RA_1', conn: 'AR_RA_1', reviewer: 'arnob', reviewee: 'rakib', skill: 'R_DIGITAL', rating: 4, content: 'Great session on secure cloud backups. Would love a follow-up deep dive on password managers.', tags: ['Patient teacher', 'Engaging'], wouldRecommend: true },
  ];
  for (const input of reviewInputs) {
    R[input.key] = OID();
    await Review.create({
      _id: R[input.key], connectionId: C[input.conn], reviewerId: U[input.reviewer], revieweeId: U[input.reviewee],
      skillId: S[input.skill], rating: input.rating, content: input.content, tags: input.tags, wouldRecommend: input.wouldRecommend,
    });
  }
  console.log(`  ${reviewInputs.length} reviews`);

  // ─── FRIENDSHIPS ──────────────────────────────────────────────────────────
  console.log('\n== Seeding friendships ==');
  const F: Record<string, Types.ObjectId> = {};
  const friendshipInputs: any[] = [
    { key: 'FR_KA', a: 'kabir', b: 'abir', reqTier: 'close_friend', addrTier: 'close_friend', metVia: 'skill_session', sharedSkill: 'K_PHOTO', acceptedAt: daysAgo(32) },
    { key: 'FR_KZ', a: 'kabir', b: 'zishan', reqTier: 'friend', addrTier: 'friend', metVia: 'skill_session', sharedSkill: 'K_PHOTO', acceptedAt: daysAgo(11) },
    { key: 'FR_KF', a: 'kabir', b: 'fahim', reqTier: 'friend', addrTier: 'friend', metVia: 'group_session', sharedSkill: 'K_PHOTO', acceptedAt: daysAgo(9) },
    { key: 'FR_AZ', a: 'abir', b: 'zishan', reqTier: 'friend', addrTier: 'friend', metVia: 'group_session', sharedSkill: 'A_SPANISH', acceptedAt: daysAgo(10) },
    { key: 'FR_AF', a: 'abir', b: 'fahim', reqTier: 'friend', addrTier: 'friend', metVia: 'skill_session', sharedSkill: 'A_SPANISH', acceptedAt: daysAgo(3) },
    { key: 'FR_ZR', a: 'zishan', b: 'rakib', reqTier: 'friend', addrTier: 'friend', metVia: 'group_session', sharedSkill: 'Z_COOK', acceptedAt: daysAgo(6) },
    { key: 'FR_ZF', a: 'zishan', b: 'fahim', reqTier: 'friend', addrTier: 'friend', metVia: 'skill_session', sharedSkill: 'Z_COOK', acceptedAt: daysAgo(4) },
    { key: 'FR_FR', a: 'fahim', b: 'rakib', reqTier: 'close_friend', addrTier: 'friend', metVia: 'skill_session', sharedSkill: 'R_ENGLISH', acceptedAt: daysAgo(8) },
    { key: 'FR_RA', a: 'rakib', b: 'arnob', reqTier: 'friend', addrTier: 'friend', metVia: 'skill_session', sharedSkill: 'R_DIGITAL', acceptedAt: daysAgo(7) },
    { key: 'FR_ZA', a: 'zishan', b: 'arnob', reqTier: 'friend', addrTier: 'friend', metVia: 'skill_session', sharedSkill: 'Z_COOK', acceptedAt: daysAgo(2) },
    { key: 'FR_KA2', a: 'kabir', b: 'arnob', reqTier: 'friend', addrTier: 'friend', metVia: 'skill_session', sharedSkill: 'K_JS', acceptedAt: daysAgo(1) },
  ];
  for (const input of friendshipInputs) {
    const { a, b } = canonicalPair(String(U[input.a]), String(U[input.b]));
    const aKey = a === String(U[input.a]) ? input.a : input.b;
    const bKey = b === String(U[input.b]) ? input.b : input.a;
    if (aKey === bKey || String(U[aKey]) === String(U[bKey])) {
      console.log(`  skipping self-friendship ${input.key} (${aKey})`);
      continue;
    }
    F[input.key] = OID();
    await Friendship.create({
      _id: F[input.key],
      requesterId: U[aKey], addresseeId: U[bKey],
      requesterTier: aKey === input.a ? input.reqTier : input.addrTier,
      addresseeTier: aKey === input.a ? input.addrTier : input.reqTier,
      status: 'accepted', metVia: input.metVia, sharedSkillId: S[input.sharedSkill],
      showStreakTo: { requester: true, addressee: true },
      directMessageRoomId: getDirectMessageRoomId(String(U[aKey]), String(U[bKey])),
      acceptedAt: input.acceptedAt,
    });
  }
  console.log(`  ${friendshipInputs.length} friendships`);

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────
  console.log('\n== Seeding notifications ==');
  const notifInputs: any[] = [
    { user: 'kabir', type: 'request_received', refModel: 'Connection', ref: 'FA_KA_1', message: 'Fahim wants to learn Photography from you.', isRead: true },
    { user: 'kabir', type: 'request_accepted', refModel: 'Connection', ref: 'KA_AB_2', message: 'Abir accepted your request to learn Guitar.', isRead: false },
    { user: 'kabir', type: 'review_received', refModel: 'Review', ref: 'RV_ZI_KA_1', message: 'Zishan reviewed you 5 stars after a photography session.', isRead: false },
    { user: 'kabir', type: 'new_message', refModel: 'Message', ref: 'M12', message: 'New message from Abir.', isRead: false },
    { user: 'kabir', type: 'friend_request_accepted', refModel: 'Friendship', ref: 'FR_KA', message: 'Abir accepted your friend request.', isRead: true },
    { user: 'kabir', type: 'radar_match', refModel: 'SkillRadar', message: 'New guitar teachers matched your radar near Gulshan.', isRead: false },
    { user: 'abir', type: 'request_received', refModel: 'Connection', ref: 'AB_KA_2', message: 'Kabir wants to learn JavaScript from you.', isRead: true },
    { user: 'abir', type: 'request_accepted', refModel: 'Connection', ref: 'AB_KA_1', message: 'Kabir accepted your request to learn Photography.', isRead: true },
    { user: 'abir', type: 'review_received', refModel: 'Review', ref: 'RV_KA_AB_1', message: 'Kabir reviewed you 5 stars after your Spanish session.', isRead: false },
    { user: 'abir', type: 'review_received', refModel: 'Review', ref: 'RV_ZI_AB_1', message: 'Zishan reviewed you 4 stars.', isRead: false },
    { user: 'abir', type: 'group_session_joined', refModel: 'GroupSession', message: 'Zishan joined your Spanish Conversation Circle.', isRead: true },
    { user: 'abir', type: 'saved_search_match', refModel: 'SavedSearch', message: 'New JavaScript teachers matched your saved search.', isRead: false },
    { user: 'zishan', type: 'request_received', refModel: 'Connection', ref: 'KA_ZI_2', message: 'Kabir wants to learn Meditation from you.', isRead: true },
    { user: 'zishan', type: 'request_accepted', refModel: 'Connection', ref: 'ZI_KA_1', message: 'Kabir accepted your request to learn Photography.', isRead: true },
    { user: 'zishan', type: 'review_received', refModel: 'Review', ref: 'RV_KA_ZI_1', message: 'Kabir reviewed you 5 stars.', isRead: false },
    { user: 'zishan', type: 'friend_request', refModel: 'Friendship', ref: 'FR_ZA', message: 'Arnob sent you a friend request.', isRead: true },
    { user: 'zishan', type: 'new_message', refModel: 'Message', ref: 'M18', message: 'New message from Kabir.', isRead: false },
    { user: 'fahim', type: 'request_received', refModel: 'Connection', ref: 'FA_AB_1', message: 'Zishan wants to learn Healthy Cooking from you.', isRead: true },
    { user: 'fahim', type: 'request_accepted', refModel: 'Connection', ref: 'FA_RA_1', message: 'Rakib accepted your request to learn English.', isRead: true },
    { user: 'fahim', type: 'review_received', refModel: 'Review', ref: 'RV_FA_KA_1', message: 'Kabir reviewed you 5 stars.', isRead: false },
    { user: 'fahim', type: 'review_prompt', refModel: 'Connection', ref: 'FA_ZI_1', message: 'How was your cooking session with Zishan? Leave a review.', isRead: false },
    { user: 'rakib', type: 'request_received', refModel: 'Connection', ref: 'AR_RA_1', message: 'Arnob wants to learn Digital Literacy from you.', isRead: true },
    { user: 'rakib', type: 'request_accepted', refModel: 'Connection', ref: 'RA_AR_1', message: 'Arnob accepted your request to learn Web Design.', isRead: true },
    { user: 'rakib', type: 'review_received', refModel: 'Review', ref: 'RV_AR_RA_1', message: 'Arnob reviewed you 4 stars.', isRead: false },
    { user: 'rakib', type: 'friend_joined', refModel: 'Friendship', ref: 'FR_FR', message: 'Fahim accepted your friend request.', isRead: true },
    { user: 'arnob', type: 'request_received', refModel: 'Connection', ref: 'RA_AR_1', message: 'Rakib wants to learn Web Design from you.', isRead: true },
    { user: 'arnob', type: 'request_accepted', refModel: 'Connection', ref: 'AR_KA_1', message: 'Kabir accepted your request to learn JavaScript.', isRead: false },
    { user: 'arnob', type: 'review_prompt', refModel: 'Connection', ref: 'RA_AR_1', message: 'How did the web design session go? Leave a review.', isRead: false },
    { user: 'arnob', type: 'radar_match', refModel: 'SkillRadar', message: 'New Spanish teachers matched your radar.', isRead: false },
  ];
  for (const input of notifInputs) {
    const refObj = C[input.ref] ?? R[input.ref] ?? M[input.ref] ?? F[input.ref] ?? undefined;
    await Notification.create({
      userId: U[input.user], type: input.type, referenceId: refObj, referenceModel: input.refModel,
      message: input.message, isRead: input.isRead,
    });
  }
  console.log(`  ${notifInputs.length} notifications`);

  // ─── SKILL SWAPS ──────────────────────────────────────────────────────────
  console.log('\n== Seeding skill swaps ==');
  const SW: Record<string, Types.ObjectId> = {};
  const swapInputs: any[] = [
    { key: 'SW_KA_AB', a: 'kabir', b: 'abir', aTeaches: 'K_JS', bTeaches: 'A_SPANISH', status: 'accepted' },
    { key: 'SW_KA_ZI', a: 'kabir', b: 'zishan', aTeaches: 'K_PHOTO', bTeaches: 'Z_COOK', status: 'accepted' },
    { key: 'SW_AB_ZI', a: 'abir', b: 'zishan', aTeaches: 'A_GUITAR', bTeaches: 'Z_MEDITATE', status: 'accepted' },
    { key: 'SW_RA_AR', a: 'rakib', b: 'arnob', aTeaches: 'R_DIGITAL', bTeaches: 'ARN_WEB', status: 'accepted' },
    { key: 'SW_AB_KA', a: 'abir', b: 'kabir', aTeaches: 'A_PHOTO', bTeaches: 'K_JS', status: 'declined' },
    { key: 'SW_FA_RA', a: 'fahim', b: 'rakib', aTeaches: 'F_YOGA', bTeaches: 'R_ENGLISH', status: 'suggested' },
    { key: 'SW_ZI_AR', a: 'zishan', b: 'arnob', aTeaches: 'Z_MEDITATE', bTeaches: 'ARN_GARDEN', status: 'suggested' },
  ];
  for (const input of swapInputs) {
    SW[input.key] = OID();
    const { a, b } = canonicalPair(String(U[input.a]), String(U[input.b]));
    const aIsA = a === String(U[input.a]);
    await SkillSwap.create({
      _id: SW[input.key], userAId: new Types.ObjectId(a), userBId: new Types.ObjectId(b),
      userATeachesSkillId: aIsA ? S[input.aTeaches] : S[input.bTeaches],
      userBTeachesSkillId: aIsA ? S[input.bTeaches] : S[input.aTeaches],
      status: input.status,
    });
  }
  console.log(`  ${swapInputs.length} skill swaps`);

  // ─── GROUP SESSIONS ───────────────────────────────────────────────────────
  console.log('\n== Seeding group sessions ==');
  const GS: Record<string, Types.ObjectId> = {};
  const gsInputs: any[] = [
    { key: 'GS1', teacher: 'kabir', skill: 'K_PHOTO', title: 'Street Photography Walk', desc: 'A guided golden-hour walk through Gulshan Avenue for beginners.', max: 8, participants: ['abir', 'zishan', 'fahim'], format: 'in-person', status: 'open', type: 'workshop', scheduledAt: daysFromNow(3) },
    { key: 'GS2', teacher: 'kabir', skill: 'K_JS', title: 'JavaScript Study Group', desc: 'Weekly online study session for absolute beginners.', max: 6, participants: ['abir', 'arnob'], format: 'online', status: 'open', type: 'regular', scheduledAt: daysFromNow(5) },
    { key: 'GS3', teacher: 'abir', skill: 'A_SPANISH', title: 'Spanish Conversation Circle', desc: 'Relaxed speaking practice every other week in Banani.', max: 8, participants: ['kabir', 'zishan'], format: 'in-person', status: 'full', type: 'regular', scheduledAt: daysFromNow(2) },
    { key: 'GS4', teacher: 'zishan', skill: 'Z_MEDITATE', title: 'Morning Meditation Circle', desc: 'Start your day with 20 minutes of guided meditation on Zoom.', max: 12, participants: ['kabir', 'abir', 'arnob'], format: 'online', status: 'open', type: 'workshop', scheduledAt: daysFromNow(1) },
    { key: 'GS5', teacher: 'zishan', skill: 'Z_COOK', title: 'Sunday Meal Prep Workshop', desc: 'Cook a week of healthy meals together in Dhanmondi.', max: 6, participants: ['kabir', 'fahim', 'rakib'], format: 'in-person', status: 'open', type: 'workshop', scheduledAt: daysFromNow(7) },
    { key: 'GS6', teacher: 'fahim', skill: 'F_YOGA', title: 'Desk-Yoga For Programmers', desc: 'Gentle stretches for people who sit at a desk all day.', max: 10, participants: ['rakib', 'arnob'], format: 'in-person', status: 'open', type: 'workshop', scheduledAt: daysFromNow(2) },
    { key: 'GS7', teacher: 'rakib', skill: 'R_DIGITAL', title: 'Online Safety Crash Course', desc: 'Spot scams, strong passwords, and secure your accounts.', max: 8, participants: ['fahim', 'arnob'], format: 'in-person', status: 'open', type: 'workshop', scheduledAt: daysFromNow(4) },
    { key: 'GS8', teacher: 'kabir', skill: 'K_PHOTO', title: 'Portrait Lighting Basics', desc: 'Past completed workshop reviewing window-light portraits.', max: 6, participants: ['abir', 'zishan'], format: 'in-person', status: 'completed', type: 'workshop', scheduledAt: daysAgo(12) },
    { key: 'GS9', teacher: 'arnob', skill: 'ARN_GARDEN', title: 'Balcony Gardening 101', desc: 'Grow chillies and herbs in small pots on a balcony.', max: 6, participants: ['rakib'], format: 'in-person', status: 'open', type: 'workshop', scheduledAt: daysFromNow(9) },
  ];
  for (const input of gsInputs) {
    GS[input.key] = OID();
    await GroupSession.create({
      _id: GS[input.key], teacherId: U[input.teacher], skillId: S[input.skill], title: input.title,
      description: input.desc, maxParticipants: input.max, participants: input.participants.map((p: string) => U[p as UKey]),
      format: input.format, scheduledAt: input.scheduledAt, status: input.status, sessionType: input.type,
      chatRoomId: `gs-${input.key.toLowerCase()}-room`,
    });
  }
  console.log(`  ${gsInputs.length} group sessions`);

  // ─── SAVED SEARCHES ───────────────────────────────────────────────────────
  console.log('\n== Seeding saved searches ==');
  await SavedSearch.create([
    { userId: U.kabir, name: 'Spanish teachers nearby', filters: { category: 'Languages & Communication', type: 'teach', radius: 10 }, alertEnabled: true, matchedSkillIds: [S.A_SPANISH], lastAlertSentAt: daysAgo(1) },
    { userId: U.kabir, name: 'Online guitar lessons', filters: { category: 'Music & Performing Arts', format: 'online' }, alertEnabled: false, matchedSkillIds: [S.A_GUITAR] },
    { userId: U.abir, name: 'Photography workshops', filters: { category: 'Photography & Visual Arts', type: 'teach', radius: 15 }, alertEnabled: true, matchedSkillIds: [S.K_PHOTO], lastAlertSentAt: daysAgo(2) },
    { userId: U.abir, name: 'Beginners JavaScript', filters: { category: 'Technology & Web', proficiencyLevel: 'beginner' }, alertEnabled: true, matchedSkillIds: [S.K_JS], lastAlertSentAt: daysAgo(0) },
    { userId: U.zishan, name: 'Food photography tips', filters: { category: 'Photography & Visual Arts', radius: 12 }, alertEnabled: true, matchedSkillIds: [S.K_PHOTO], lastAlertSentAt: daysAgo(3) },
    { userId: U.zishan, name: 'Beginner guitar', filters: { category: 'Music & Performing Arts', type: 'teach', format: 'in-person' }, alertEnabled: false, matchedSkillIds: [S.A_GUITAR] },
    { userId: U.fahim, name: 'Healthy cooking teachers', filters: { category: 'Food & Cooking', type: 'teach', radius: 20 }, alertEnabled: true, matchedSkillIds: [S.Z_COOK], lastAlertSentAt: daysAgo(1) },
    { userId: U.fahim, name: 'English conversation practice', filters: { category: 'Languages & Communication', format: 'online' }, alertEnabled: false, matchedSkillIds: [S.R_ENGLISH] },
    { userId: U.rakib, name: 'Cooking for families', filters: { category: 'Food & Cooking', radius: 15 }, alertEnabled: true, matchedSkillIds: [S.Z_COOK], lastAlertSentAt: daysAgo(2) },
    { userId: U.rakib, name: 'Gentle yoga', filters: { category: 'Music & Performing Arts', type: 'teach', format: 'in-person' }, alertEnabled: false, matchedSkillIds: [S.F_YOGA] },
    { userId: U.arnob, name: 'Spanish for travel', filters: { category: 'Languages & Communication', type: 'teach' }, alertEnabled: true, matchedSkillIds: [S.A_SPANISH], lastAlertSentAt: daysAgo(0) },
    { userId: U.arnob, name: 'Learn guitar chords', filters: { category: 'Music & Performing Arts', format: 'in-person' }, alertEnabled: false, matchedSkillIds: [S.A_GUITAR] },
  ]);
  console.log('  12 saved searches');

  // ─── COMMUNITY POSTS ──────────────────────────────────────────────────────
  console.log('\n== Seeding community posts ==');
  const P: Record<string, Types.ObjectId> = {};
  const postInputs: any[] = [
    { key: 'P1', author: 'kabir', content: 'Captured an amazing golden-hour shot on Gulshan Avenue this morning. Anyone else love street photography?', votes: [{ u: 'abir', vote: 'up' }, { u: 'zishan', vote: 'up' }, { u: 'fahim', vote: 'up' }] },
    { key: 'P2', author: 'kabir', content: 'Starting a weekly JavaScript study group - DM me if you want the Zoom link!', votes: [{ u: 'abir', vote: 'up' }, { u: 'arnob', vote: 'up' }] },
    { key: 'P3', author: 'abir', content: 'My first chord progression: D - A - Em on guitar. Thanks Kabir for the encouragement!', votes: [{ u: 'kabir', vote: 'up' }, { u: 'zishan', vote: 'up' }] },
    { key: 'P4', author: 'abir', content: 'Hosting a free Spanish conversation circle on Sunday. Perfect for beginners!', votes: [{ u: 'kabir', vote: 'up' }, { u: 'fahim', vote: 'up' }, { u: 'zishan', vote: 'down' }] },
    { key: 'P5', author: 'zishan', content: 'Free guided meditation session this Sunday morning at 8 AM on Zoom. Link in the comments!', votes: [{ u: 'kabir', vote: 'up' }, { u: 'abir', vote: 'up' }, { u: 'arnob', vote: 'up' }] },
    { key: 'P6', author: 'zishan', content: 'Falafel wraps for meal prep are a total game changer. Recipe coming tomorrow.', votes: [{ u: 'kabir', vote: 'up' }, { u: 'rakib', vote: 'up' }] },
    { key: 'P7', author: 'fahim', content: 'Teaching free smartphone basics at the Uttara community centre every Friday. Bring your phone!', votes: [{ u: 'rakib', vote: 'up' }] },
    { key: 'P8', author: 'rakib', content: 'PSA: never reuse passwords. Happy to run a quick online-safety workshop for your building.', votes: [{ u: 'fahim', vote: 'up' }, { u: 'arnob', vote: 'up' }] },
    { key: 'P9', author: 'arnob', content: 'My balcony tomatoes are finally turning red! Growing chillies and mint too.', votes: [{ u: 'zishan', vote: 'up' }, { u: 'kabir', vote: 'up' }] },
    { key: 'P10', author: 'arnob', content: 'Offering a free intro-to-HTML workshop for total beginners next Saturday.', votes: [{ u: 'rakib', vote: 'up' }] },
  ];
  for (const input of postInputs) {
    P[input.key] = OID();
    const userVotes = input.votes.map((v: { u: string; vote: 'up' | 'down' }) => ({ userId: U[v.u as UKey], vote: v.vote }));
    const score = userVotes.reduce((acc: number, v: { vote: 'up' | 'down' }) => acc + (v.vote === 'up' ? 1 : -1), 0);
    await CommunityPost.create({
      _id: P[input.key], authorId: U[input.author], content: input.content, city: 'dhaka', neighborhood: LOCS[input.author === 'kabir' ? 'gulshan' : input.author === 'abir' ? 'banani' : input.author === 'zishan' ? 'dhanmondi' : input.author === 'fahim' ? 'uttara' : input.author === 'rakib' ? 'mirpur' : 'motijheel'].neighborhood.toLowerCase(),
      voteScore: score, userVotes, isDeleted: false, isFlagged: false,
    });
  }
  console.log(`  ${postInputs.length} community posts`);

  // ─── ENDORSEMENTS ─────────────────────────────────────────────────────────
  console.log('\n== Seeding endorsements ==');
  await Endorsement.create([
    { endorserId: U.abir, endorseeId: U.kabir, skillId: S.K_PHOTO, connectionId: C.AB_KA_1 },
    { endorserId: U.zishan, endorseeId: U.kabir, skillId: S.K_PHOTO, connectionId: C.ZI_KA_1 },
    { endorserId: U.fahim, endorseeId: U.kabir, skillId: S.K_PHOTO, connectionId: C.FA_KA_1 },
    { endorserId: U.kabir, endorseeId: U.abir, skillId: S.A_SPANISH, connectionId: C.KA_AB_1 },
    { endorserId: U.zishan, endorseeId: U.abir, skillId: S.A_GUITAR, connectionId: C.ZI_AB_2 },
    { endorserId: U.kabir, endorseeId: U.zishan, skillId: S.Z_COOK, connectionId: C.KA_ZI_1 },
    { endorserId: U.abir, endorseeId: U.zishan, skillId: S.Z_MEDITATE, connectionId: C.AB_ZI_1 },
    { endorserId: U.fahim, endorseeId: U.rakib, skillId: S.R_ENGLISH, connectionId: C.FA_RA_1 },
    { endorserId: U.arnob, endorseeId: U.rakib, skillId: S.R_DIGITAL, connectionId: C.AR_RA_1 },
  ]);
  console.log('  9 endorsements');

  // ─── COURSES ──────────────────────────────────────────────────────────────
  console.log('\n== Seeding courses ==');
  const CR: Record<string, Types.ObjectId> = {};
  const courseInputs: any[] = [
    { key: 'CR1', teacher: 'kabir', skill: 'K_PHOTO', title: 'Photography Fundamentals', desc: 'A complete beginner course covering camera basics, composition, light and simple editing.', sessions: [
      { title: 'Camera Basics', description: 'Understanding exposure modes and your camera controls.', objectives: ['Identify camera parts', 'Set exposure modes'], order: 0, estimatedMinutes: 60 },
      { title: 'Composition', description: 'Rule of thirds, leading lines and framing.', objectives: ['Apply rule of thirds'], order: 1, estimatedMinutes: 60 },
      { title: 'Natural Light', description: 'Working with available light, including golden hour.', objectives: ['Use golden hour effectively'], order: 2, estimatedMinutes: 60 },
      { title: 'Editing Basics', description: 'A gentle introduction to photo editing.', objectives: ['Edit a photo end to end'], order: 3, estimatedMinutes: 60 },
    ], max: 20, count: 2, status: 'published', total: 240 },
    { key: 'CR2', teacher: 'kabir', skill: 'K_JS', title: 'JavaScript for Absolute Beginners', desc: 'Draft course covering variables, functions and the DOM.', sessions: [
      { title: 'Variables & Types', description: 'The building blocks.', objectives: ['Declare variables'], order: 0, estimatedMinutes: 45 },
      { title: 'Functions', description: 'Write and call functions.', objectives: ['Write functions'], order: 1, estimatedMinutes: 45 },
      { title: 'DOM Manipulation', description: 'Make pages interactive.', objectives: ['Manipulate the DOM'], order: 2, estimatedMinutes: 45 },
    ], max: 10, count: 0, status: 'draft', total: 135 },
    { key: 'CR3', teacher: 'abir', skill: 'A_SPANISH', title: 'Conversational Spanish', desc: 'Speak Spanish with confidence - from greetings to real conversations.', sessions: [
      { title: 'Greetings & Introductions', description: 'Say hello properly.', objectives: ['Greet people'], order: 0, estimatedMinutes: 45 },
      { title: 'At the Cafe', description: 'Order food and drinks.', objectives: ['Order food and drinks'], order: 1, estimatedMinutes: 45 },
      { title: 'Getting Around', description: 'Ask for and give directions.', objectives: ['Ask for directions'], order: 2, estimatedMinutes: 45 },
      { title: 'Shopping', description: 'Prices, bargaining and buying.', objectives: ['Bargain and buy'], order: 3, estimatedMinutes: 45 },
      { title: 'Conversation Practice', description: 'Put it all together.', objectives: ['Hold a full conversation'], order: 4, estimatedMinutes: 45 },
    ], max: 15, count: 3, status: 'published', total: 225 },
    { key: 'CR4', teacher: 'zishan', skill: 'Z_MEDITATE', title: 'Mindfulness for Beginners', desc: 'A gentle 4-session introduction to daily meditation.', sessions: [
      { title: 'Breathing', description: 'Foundational breathing techniques.', objectives: ['Practice deep breathing'], order: 0, estimatedMinutes: 30 },
      { title: 'Body Scan', description: 'Relax each part of the body.', objectives: ['Run a body scan'], order: 1, estimatedMinutes: 30 },
      { title: 'Walking Meditation', description: 'Bringing mindfulness into motion.', objectives: ['Practice mindful walking'], order: 2, estimatedMinutes: 30 },
      { title: 'Loving-Kindness', description: 'Compassion for self and others.', objectives: ['Practice loving-kindness'], order: 3, estimatedMinutes: 30 },
    ], max: 12, count: 4, status: 'published', total: 120 },
    { key: 'CR5', teacher: 'rakib', skill: 'R_DIGITAL', title: 'Digital Skills for Daily Life', desc: 'Email, video calls, online safety and confidence with technology.', sessions: [
      { title: 'Email Done Right', description: 'Compose, attach and organise.', objectives: ['Send a well-formed email'], order: 0, estimatedMinutes: 45 },
      { title: 'Video Calls', description: 'Join and host calls comfortably.', objectives: ['Join a video call'], order: 1, estimatedMinutes: 45 },
      { title: 'Online Safety', description: 'Spot scams and protect accounts.', objectives: ['Create strong passwords'], order: 2, estimatedMinutes: 45 },
      { title: 'Backups & Clouds', description: 'Keep files safe.', objectives: ['Set up automatic backups'], order: 3, estimatedMinutes: 45 },
    ], max: 12, count: 2, status: 'published', total: 180 },
    { key: 'CR6', teacher: 'arnob', skill: 'ARN_WEB', title: 'Build Your First Web Page', desc: 'HTML & CSS from zero - finish with your own live-looking page.', sessions: [
      { title: 'HTML Structure', description: 'Headings, paragraphs and links.', objectives: ['Write semantic HTML'], order: 0, estimatedMinutes: 60 },
      { title: 'CSS Styling', description: 'Color, spacing and fonts.', objectives: ['Style a page with CSS'], order: 1, estimatedMinutes: 60 },
      { title: 'Images & Layout', description: 'Make it look professional.', objectives: ['Create a simple layout'], order: 2, estimatedMinutes: 60 },
    ], max: 10, count: 1, status: 'draft', total: 180 },
  ];
  for (const input of courseInputs) {
    CR[input.key] = OID();
    await Course.create({
      _id: CR[input.key], teacherId: U[input.teacher], skillId: S[input.skill], title: input.title,
      description: input.desc, sessions: input.sessions, maxEnrollments: input.max,
      enrollmentCount: input.count, status: input.status, totalEstimatedMinutes: input.total,
    });
  }
  console.log(`  ${courseInputs.length} courses`);

  // ─── COURSE ENROLLMENTS ───────────────────────────────────────────────────
  console.log('\n== Seeding course enrollments ==');
  const CE: Record<string, Types.ObjectId> = {};
  const ceInputs: any[] = [
    { key: 'CE1', course: 'CR1', learner: 'abir', status: 'in_progress', progress: [{ sessionIndex: 0, completed: true, completedAt: daysAgo(4) }, { sessionIndex: 1, completed: true, completedAt: daysAgo(1) }], startedAt: daysAgo(12) },
    { key: 'CE2', course: 'CR1', learner: 'zishan', status: 'completed', progress: [{ sessionIndex: 0, completed: true }, { sessionIndex: 1, completed: true }, { sessionIndex: 2, completed: true }, { sessionIndex: 3, completed: true }], startedAt: daysAgo(30), completedAt: daysAgo(2), certificateId: 'cert_zishan_photo' },
    { key: 'CE3', course: 'CR3', learner: 'kabir', status: 'in_progress', progress: [{ sessionIndex: 0, completed: true, completedAt: daysAgo(6) }, { sessionIndex: 1, completed: true, completedAt: daysAgo(3) }], startedAt: daysAgo(14) },
    { key: 'CE4', course: 'CR3', learner: 'zishan', status: 'completed', progress: [{ sessionIndex: 0, completed: true }, { sessionIndex: 1, completed: true }, { sessionIndex: 2, completed: true }, { sessionIndex: 3, completed: true }, { sessionIndex: 4, completed: true }], startedAt: daysAgo(28), completedAt: daysAgo(4), certificateId: 'cert_zishan_spanish' },
    { key: 'CE5', course: 'CR4', learner: 'kabir', status: 'in_progress', progress: [{ sessionIndex: 0, completed: true, completedAt: daysAgo(2) }, { sessionIndex: 1, completed: false }], startedAt: daysAgo(6) },
    { key: 'CE6', course: 'CR4', learner: 'abir', status: 'completed', progress: [{ sessionIndex: 0, completed: true }, { sessionIndex: 1, completed: true }, { sessionIndex: 2, completed: true }, { sessionIndex: 3, completed: true }], startedAt: daysAgo(20), completedAt: daysAgo(1), certificateId: 'cert_abir_mindful' },
    { key: 'CE7', course: 'CR4', learner: 'arnob', status: 'enrolled', progress: [], startedAt: daysAgo(1) },
    { key: 'CE8', course: 'CR5', learner: 'fahim', status: 'in_progress', progress: [{ sessionIndex: 0, completed: true, completedAt: daysAgo(2) }], startedAt: daysAgo(5) },
    { key: 'CE9', course: 'CR5', learner: 'arnob', status: 'enrolled', progress: [], startedAt: daysAgo(1) },
    { key: 'CE10', course: 'CR6', learner: 'rakib', status: 'in_progress', progress: [{ sessionIndex: 0, completed: true, completedAt: daysAgo(1) }], startedAt: daysAgo(3) },
  ];
  for (const input of ceInputs) {
    CE[input.key] = OID();
    await CourseEnrollment.create({
      _id: CE[input.key], courseId: CR[input.course], learnerId: U[input.learner], status: input.status,
      progress: input.progress, startedAt: input.startedAt, completedAt: input.completedAt, certificateId: input.certificateId,
    });
  }
  console.log(`  ${ceInputs.length} enrollments`);

  // ─── CHALLENGES ───────────────────────────────────────────────────────────
  console.log('\n== Seeding challenges ==');
  const CH: Record<string, Types.ObjectId> = {};
  const chInputs: any[] = [
    { key: 'CH1', creator: 'kabir', title: 'Photo a Day', desc: 'Take one creative photo every day for a month.', cat: 'Photography & Visual Arts', type: 'both', goal: 'Take 30 creative photos', target: 30, start: daysAgo(3), end: daysFromNow(27), status: 'active', participants: [{ u: 'kabir', ago: 3, progress: 8 }, { u: 'abir', ago: 2, progress: 5 }, { u: 'zishan', ago: 1, progress: 3 }], badge: 'Shutterbug', icon: '📸', max: 50 },
    { key: 'CH2', creator: 'abir', title: 'Spanish Sprint', desc: 'Learn 50 new Spanish words in a week.', cat: 'Languages & Communication', type: 'learn', goal: 'Score 5/5 on the weekly quiz', target: 5, start: daysFromNow(2), end: daysFromNow(9), status: 'upcoming', participants: [], badge: 'Polyglot', icon: '🗣️' },
    { key: 'CH3', creator: 'zishan', title: 'Mindful Month', desc: 'Meditate every day for 30 days.', cat: 'Music & Performing Arts', type: 'both', goal: '30 days of meditation', target: 30, start: daysAgo(30), end: daysAgo(1), status: 'completed', participants: [{ u: 'zishan', ago: 30, progress: 30, completedAt: daysAgo(1) }, { u: 'kabir', ago: 28, progress: 22 }], badge: 'Zen Master', icon: '🧘' },
    { key: 'CH4', creator: 'rakib', title: 'Tech-Safe Families', desc: 'Help one neighbour secure their online accounts.', cat: 'Digital Literacy', type: 'teach', goal: 'Complete 5 family safety checkups', target: 5, start: daysFromNow(1), end: daysFromNow(14), status: 'upcoming', participants: [{ u: 'rakib', ago: 0, progress: 0 }, { u: 'fahim', ago: 0, progress: 0 }], badge: 'Cyber Guardian', icon: '🛡️', max: 30 },
    { key: 'CH5', creator: 'arnob', title: 'Grow Your Own Greens', desc: 'Grow a potted plant from seed to harvest.', cat: 'Home & Garden', type: 'learn', goal: 'Harvest something edible', target: 1, start: daysAgo(2), end: daysFromNow(20), status: 'active', participants: [{ u: 'arnob', ago: 2, progress: 1 }, { u: 'kabir', ago: 1, progress: 1 }], badge: 'Urban Farmer', icon: '🌱', max: 40 },
  ];
  for (const input of chInputs) {
    CH[input.key] = OID();
    await Challenge.create({
      _id: CH[input.key], creatorId: U[input.creator], title: input.title, description: input.desc,
      skillCategory: input.cat, challengeType: input.type, goalDescription: input.goal, goalTarget: input.target,
      startDate: input.start, endDate: input.end, status: input.status,
      participants: input.participants.map((p: any) => ({ userId: U[p.u as UKey], joinedAt: daysAgo(p.ago), progress: p.progress, completedAt: p.completedAt })),
      badgeName: input.badge, badgeIcon: input.icon, maxParticipants: input.max,
    });
  }
  console.log(`  ${chInputs.length} challenges`);

  // ─── MENTORSHIPS ──────────────────────────────────────────────────────────
  console.log('\n== Seeding mentorships ==');
  const MS: Record<string, Types.ObjectId> = {};
  const msInputs: any[] = [
    { key: 'MS1', mentor: 'kabir', mentee: 'zishan', skill: 'K_PHOTO', status: 'active', goals: [{ title: 'Master food photography', description: 'Use natural light and composition for blog photos', targetDate: daysFromNow(30), completed: false }, { title: 'Build a photo portfolio', description: '10 portfolio images', completed: false }], checkIns: [{ date: daysAgo(2), notes: 'Practised overhead shots with window light.', mentorNotes: 'Great improvement on exposure!' }], startDate: daysAgo(10), durationMonths: 2, meeting: 'weekly' },
    { key: 'MS2', mentor: 'abir', mentee: 'kabir', skill: 'A_SPANISH', status: 'active', goals: [{ title: 'Hold a 5-minute conversation', completed: false }], checkIns: [{ date: daysAgo(4), notes: 'Practised ordering at a cafe.', mentorNotes: 'Good pronunciation.' }], startDate: daysAgo(14), durationMonths: 2, meeting: 'weekly' },
    { key: 'MS3', mentor: 'zishan', mentee: 'abir', skill: 'Z_MEDITATE', status: 'completed', goals: [{ title: 'Establish a daily practice', completed: true, completedAt: daysAgo(1) }], checkIns: [{ date: daysAgo(5), notes: 'Completed a 10-day streak.', mentorNotes: 'Well done!' }], startDate: daysAgo(30), completedAt: daysAgo(1), durationMonths: 1, meeting: 'weekly' },
    { key: 'MS4', mentor: 'rakib', mentee: 'fahim', skill: 'R_ENGLISH', status: 'active', goals: [{ title: 'Run a flawless client call', completed: false }], checkIns: [{ date: daysAgo(2), notes: 'Rehearsed the opening script.', mentorNotes: 'Confidence is growing.' }], startDate: daysAgo(8), durationMonths: 2, meeting: 'weekly' },
    { key: 'MS5', mentor: 'fahim', mentee: 'rakib', skill: 'F_YOGA', status: 'pending', goals: [{ title: 'Build a morning stretch routine', completed: false }], checkIns: [], startDate: daysAgo(1), durationMonths: 1, meeting: 'biweekly' },
    { key: 'MS6', mentor: 'arnob', mentee: 'rakib', skill: 'ARN_WEB', status: 'active', goals: [{ title: 'Ship a personal homepage', completed: false }], checkIns: [{ date: daysAgo(1), notes: 'Wrote the HTML structure.', mentorNotes: 'Clean semantics!' }], startDate: daysAgo(3), durationMonths: 2, meeting: 'weekly' },
  ];
  for (const input of msInputs) {
    MS[input.key] = OID();
    await Mentorship.create({
      _id: MS[input.key], mentorId: U[input.mentor], menteeId: U[input.mentee], skillId: S[input.skill],
      status: input.status, goals: input.goals, checkIns: input.checkIns, startDate: input.startDate,
      completedAt: input.completedAt, durationMonths: input.durationMonths, meetingFrequency: input.meeting,
    });
  }
  console.log(`  ${msInputs.length} mentorships`);

  // ─── SHOWCASES ────────────────────────────────────────────────────────────
  console.log('\n== Seeding showcases ==');
  const checkout: Record<string, Types.ObjectId> = {};
  const showcaseInputs: any[] = [
    { key: 'SH1', user: 'kabir', skill: 'K_PHOTO', title: 'Golden Hour in Gulshan', desc: 'My best street shot this month.', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/kabir_golden.jpg', publicId: 'show/kabir_golden', caption: 'Golden hour magic' }], likes: [{ u: 'abir', ago: 1 }, { u: 'zishan', ago: 1 }, { u: 'fahim', ago: 1 }], comments: 2 },
    { key: 'SH2', user: 'kabir', skill: 'K_JS', title: 'My First Todo App', desc: 'Built with vanilla JavaScript during a study session.', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/kabir_todo.jpg', publicId: 'show/kabir_todo' }], likes: [{ u: 'abir', ago: 2 }], comments: 0 },
    { key: 'SH3', user: 'abir', skill: 'A_SPANISH', title: 'First Spanish Conversation', desc: 'Held a three-minute conversation entirely in Spanish!', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/abir_spanish.jpg', publicId: 'show/abir_spanish' }], likes: [{ u: 'kabir', ago: 3 }, { u: 'zishan', ago: 3 }], comments: 1 },
    { key: 'SH4', user: 'zishan', skill: 'Z_COOK', title: 'Meal Prep Sunday', desc: 'A whole week of healthy lunches in one hour.', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/zishan_mealprep.jpg', publicId: 'show/zishan_mealprep', caption: 'Meal prep done right' }], likes: [{ u: 'kabir', ago: 2 }, { u: 'fahim', ago: 2 }, { u: 'rakib', ago: 2 }], comments: 3 },
    { key: 'SH5', user: 'fahim', skill: 'F_YOGA', title: '30-Day Mobility Streak', desc: 'Flexible, pain-free and consistent for a month.', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/fahim_mobility.jpg', publicId: 'show/fahim_mobility' }], likes: [{ u: 'rakib', ago: 1 }, { u: 'kabir', ago: 1 }], comments: 0 },
    { key: 'SH6', user: 'rakib', skill: 'R_DIGITAL', title: 'Grandma now sends emails!', desc: 'My proudest teaching moment this month.', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/rakib_grandma.jpg', publicId: 'show/rakib_grandma' }], likes: [{ u: 'fahim', ago: 0 }, { u: 'arnob', ago: 0 }, { u: 'zishan', ago: 0 }], comments: 4 },
    { key: 'SH7', user: 'arnob', skill: 'ARN_GARDEN', title: 'Balcony Harvest', desc: 'Chillies, mint and cherry tomatoes from two pots.', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/arnob_harvest.jpg', publicId: 'show/arnob_harvest' }], likes: [{ u: 'zishan', ago: 1 }, { u: 'kabir', ago: 1 }], comments: 1 },
    { key: 'SH8', user: 'abir', skill: 'A_GUITAR', title: 'First Complete Song', desc: 'Played Wonderwall from start to finish.', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/abir_song.jpg', publicId: 'show/abir_song' }], likes: [{ u: 'kabir', ago: 0 }], comments: 0 },
  ];
  for (const input of showcaseInputs) {
    checkout[input.key] = OID();
    await Showcase.create({
      _id: checkout[input.key], userId: U[input.user], skillId: S[input.skill], title: input.title, description: input.desc,
      media: input.media, likes: input.likes.map((l: any) => ({ userId: U[l.u as UKey], createdAt: daysAgo(l.ago) })),
      likeCount: input.likes.length, commentCount: input.comments, isDeleted: false,
    });
  }
  console.log(`  ${showcaseInputs.length} showcases`);

  // ─── WEBHOOKS ─────────────────────────────────────────────────────────────
  console.log('\n== Seeding webhooks ==');
  const WH: Record<string, Types.ObjectId> = {};
  const whInputs: any[] = [
    { key: 'WH1', owner: 'kabir', url: 'https://example.com/hooks/kabir', events: ['session.completed', 'member.joined'], secret: 'whsec_kabir_1', status: 'active', failCount: 0, lastTriggeredAt: daysAgo(1), lastSuccessAt: daysAgo(1), logs: [{ event: 'session.completed', payload: { ok: true }, statusCode: 200, success: true, attemptedAt: daysAgo(1) }] },
    { key: 'WH2', owner: 'abir', url: 'https://example.com/hooks/abir', events: ['review.created'], secret: 'whsec_abir_1', status: 'active', failCount: 0, lastTriggeredAt: daysAgo(2), lastSuccessAt: daysAgo(2), logs: [{ event: 'review.created', payload: { ok: true }, statusCode: 200, success: true, attemptedAt: daysAgo(2) }] },
    { key: 'WH3', owner: 'zishan', url: 'https://example.com/hooks/zishan', events: ['connection.completed'], secret: 'whsec_zishan_1', status: 'disabled', failCount: 2, lastTriggeredAt: daysAgo(5), logs: [{ event: 'connection.completed', payload: {}, statusCode: 500, success: false, error: 'Timeout', attemptedAt: daysAgo(5) }] },
    { key: 'WH4', owner: 'arnob', url: 'https://example.com/hooks/arnob', events: ['skill.created', 'session.completed'], secret: 'whsec_arnob_1', status: 'active', failCount: 0, lastTriggeredAt: daysAgo(0), lastSuccessAt: daysAgo(0), logs: [{ event: 'skill.created', payload: { ok: true }, statusCode: 200, success: true, attemptedAt: daysAgo(0) }] },
  ];
  for (const input of whInputs) {
    WH[input.key] = OID();
    await Webhook.create({
      _id: WH[input.key], ownerId: U[input.owner], url: input.url, events: input.events, secret: input.secret,
      status: input.status, failCount: input.failCount, lastTriggeredAt: input.lastTriggeredAt,
      lastSuccessAt: input.lastSuccessAt, logs: input.logs,
    });
  }
  console.log(`  ${whInputs.length} webhooks`);

  // ─── API KEYS ─────────────────────────────────────────────────────────────
  console.log('\n== Seeding API keys ==');
  await ApiKey.create([
    { ownerId: U.kabir, key: 'sk_prod_kabir_1', name: 'Kabir Production Key', scopes: ['skills:read', 'stats:read'], status: 'active', rateLimit: 100, requestCount: 55, lastUsedAt: daysAgo(0), expiresAt: daysFromNow(60) },
    { ownerId: U.kabir, key: 'sk_prod_kabir_old', name: 'Kabir Legacy Key', scopes: ['skills:read'], status: 'revoked', rateLimit: 100, requestCount: 12, lastUsedAt: daysAgo(15), expiresAt: daysAgo(45) },
    { ownerId: U.abir, key: 'sk_prod_abir_1', name: 'Abir Production Key', scopes: ['users:read', 'skills:read'], status: 'active', rateLimit: 100, requestCount: 30, lastUsedAt: daysAgo(1), expiresAt: daysFromNow(45) },
    { ownerId: U.zishan, key: 'sk_prod_zishan_1', name: 'Zishan Production Key', scopes: ['skills:read', 'stats:read'], status: 'active', rateLimit: 75, requestCount: 9, lastUsedAt: daysAgo(3), expiresAt: daysFromNow(30) },
    { ownerId: U.arnob, key: 'sk_prod_arnob_1', name: 'Arnob Production Key', scopes: ['skills:read'], status: 'active', rateLimit: 50, requestCount: 4, lastUsedAt: daysAgo(2), expiresAt: daysFromNow(90) },
  ]);
  console.log('  5 API keys');

  // ─── CALENDAR INTEGRATIONS ────────────────────────────────────────────────
  console.log('\n== Seeding calendar integrations ==');
  await CalendarIntegration.create([
    { userId: U.kabir, provider: 'google', accessToken: 'at_google_kabir', refreshToken: 'rt_google_kabir', calendarId: 'primary', calendarName: 'Primary', syncStatus: 'active', lastSyncedAt: daysAgo(0), syncToken: 'sync_kabir_1', events: [{ externalId: 'ev_k1', title: 'Street Photography Walk', start: daysFromNow(1), end: daysFromNow(1), description: 'Group photo walk in Gulshan', location: 'Gulshan Avenue', connectionId: C.AB_KA_1 }] },
    { userId: U.abir, provider: 'google', accessToken: 'at_google_abir', refreshToken: 'rt_google_abir', calendarId: 'primary', calendarName: 'Primary', syncStatus: 'active', lastSyncedAt: daysAgo(1), syncToken: 'sync_abir_1', events: [{ externalId: 'ev_a1', title: 'Spanish Circle', start: daysFromNow(2), end: daysFromNow(2), description: 'Conversation circle', location: 'Banani', connectionId: C.KA_AB_1 }] },
    { userId: U.zishan, provider: 'google', accessToken: 'at_google_zishan', refreshToken: 'rt_google_zishan', calendarId: 'primary', calendarName: 'Primary', syncStatus: 'active', lastSyncedAt: daysAgo(0), syncToken: 'sync_zishan_1', events: [{ externalId: 'ev_z1', title: 'Meditation Circle', start: daysFromNow(1), end: daysFromNow(1), description: 'Morning meditation', location: 'Zoom', connectionId: C.KA_ZI_2 }] },
    { userId: U.fahim, provider: 'outlook', accessToken: 'at_outlook_fahim', refreshToken: 'rt_outlook_fahim', calendarId: 'outlook', calendarName: 'Outlook', syncStatus: 'error', lastSyncedAt: daysAgo(7), syncToken: 'sync_fahim_1', events: [] },
    { userId: U.rakib, provider: 'google', accessToken: 'at_google_rakib', refreshToken: 'rt_google_rakib', calendarId: 'primary', calendarName: 'Primary', syncStatus: 'active', lastSyncedAt: daysAgo(2), syncToken: 'sync_rakib_1', events: [{ externalId: 'ev_r1', title: 'English Coaching', start: daysFromNow(2), end: daysFromNow(2), description: 'Client-call practice', connectionId: C.FA_RA_1 }] },
    { userId: U.arnob, provider: 'outlook', accessToken: 'at_outlook_arnob', refreshToken: 'rt_outlook_arnob', calendarId: 'outlook', calendarName: 'Work Calendar', syncStatus: 'disabled', lastSyncedAt: daysAgo(10), syncToken: 'sync_arnob_1', events: [] },
  ]);
  console.log('  6 calendar integrations');

  // ─── BOT INSTALLATIONS ────────────────────────────────────────────────────
  console.log('\n== Seeding bot installations ==');
  await BotInstallation.create([
    { externalId: 'ext_slack_kabir', name: 'Skill Hearth Bot', platform: 'slack', accessToken: 'at_slack_kabir', botToken: 'bt_slack_kabir', teamId: 'T_KABIR', teamName: 'Kabir Workspace', channelId: 'C_KABIR', channelName: 'general', installedBy: U.kabir, status: 'active', lastUsedAt: daysAgo(1), commandCount: 20 },
    { externalId: 'ext_discord_abir', name: 'Hearth Bot', platform: 'discord', accessToken: 'at_discord_abir', botToken: 'bt_discord_abir', installedBy: U.abir, status: 'active', commandCount: 12 },
    { externalId: 'ext_slack_zishan', name: 'Kitchen Bot', platform: 'slack', accessToken: 'at_slack_zishan', botToken: 'bt_slack_zishan', installedBy: U.zishan, status: 'disabled', commandCount: 5 },
    { externalId: 'ext_slack_arnob', name: 'Garden Bot', platform: 'slack', accessToken: 'at_slack_arnob', botToken: 'bt_slack_arnob', teamId: 'T_ARN', teamName: 'Arnob Station', channelId: 'C_ARN', channelName: 'side-projects', installedBy: U.arnob, status: 'active', lastUsedAt: daysAgo(3), commandCount: 8 },
  ]);
  console.log('  4 bot installations');

  // ─── ACTIVITY EVENTS ──────────────────────────────────────────────────────
  console.log('\n== Seeding activity events ==');
  const AE: Record<string, Types.ObjectId> = {};
  const aeInputs: any[] = [
    { key: 'AE1', actor: 'kabir', eventType: 'skill_added', subjectType: 'skill', subject: 'K_PHOTO', title: 'Kabir added a skill: Photography', subtitle: 'Photography & Visual Arts', visibility: 'public', ago: 30, expires: 90, reactions: [{ u: 'abir', emoji: '❤️', ago: 29 }, { u: 'zishan', emoji: '🔥', ago: 29 }] },
    { key: 'AE2', actor: 'kabir', eventType: 'badge_earned', subjectType: 'badge', subject: null, title: 'Kabir earned: Local Legend', subtitle: '', visibility: 'friends', ago: 5, expires: 90, reactions: [{ u: 'abir', emoji: '👏', ago: 4 }] },
    { key: 'AE3', actor: 'kabir', eventType: 'session_taught', subjectType: 'connection', subject: 'AB_KA_1', title: 'Kabir taught a photography session', subtitle: 'Photography & Visual Arts', visibility: 'friends', ago: 14, expires: 90, reactions: [{ u: 'abir', emoji: '🎉', ago: 13 }] },
    { key: 'AE4', actor: 'kabir', eventType: 'challenge_completed', subjectType: 'challenge', subject: 'CH3', title: 'Kabir completed: Mindful Month', subtitle: 'Music & Performing Arts', visibility: 'friends', ago: 3, expires: 90 },
    { key: 'AE5', actor: 'abir', eventType: 'skill_added', subjectType: 'skill', subject: 'A_SPANISH', title: 'Abir added a skill: Spanish', subtitle: 'Languages & Communication', visibility: 'public', ago: 25, expires: 90, reactions: [{ u: 'kabir', emoji: '❤️', ago: 24 }] },
    { key: 'AE6', actor: 'abir', eventType: 'session_completed', subjectType: 'connection', subject: 'KA_AB_1', title: 'Abir completed a Spanish session', subtitle: 'Spanish', visibility: 'friends', ago: 9, expires: 90, reactions: [{ u: 'kabir', emoji: '👍', ago: 8 }] },
    { key: 'AE7', actor: 'abir', eventType: 'review_received', subjectType: 'review', subject: 'RV_KA_AB_1', title: 'Abir received a 5-star review', subtitle: 'Spanish', visibility: 'friends', ago: 8, expires: 90 },
    { key: 'AE8', actor: 'zishan', eventType: 'skill_added', subjectType: 'skill', subject: 'Z_COOK', title: 'Zishan added a skill: Healthy Cooking', subtitle: 'Food & Cooking', visibility: 'public', ago: 20, expires: 90, reactions: [{ u: 'kabir', emoji: '❤️', ago: 19 }] },
    { key: 'AE9', actor: 'zishan', eventType: 'challenge_completed', subjectType: 'challenge', subject: 'CH3', title: 'Zishan completed: Mindful Month', subtitle: 'Music & Performing Arts', visibility: 'public', ago: 1, expires: 90, reactions: [{ u: 'kabir', emoji: '🎉', ago: 0 }, { u: 'abir', emoji: '🏆', ago: 0 }] },
    { key: 'AE10', actor: 'fahim', eventType: 'skill_added', subjectType: 'skill', subject: 'F_YOGA', title: 'Fahim added a skill: Yoga & Stretching', subtitle: 'Music & Performing Arts', visibility: 'public', ago: 12, expires: 90 },
    { key: 'AE11', actor: 'rakib', eventType: 'session_taught', subjectType: 'connection', subject: 'FA_RA_1', title: 'Rakib taught an English session', subtitle: 'English Conversation', visibility: 'friends', ago: 2, expires: 90, reactions: [{ u: 'fahim', emoji: '😊', ago: 1 }] },
    { key: 'AE12', actor: 'arnob', eventType: 'skill_added', subjectType: 'skill', subject: 'ARN_GARDEN', title: 'Arnob added a skill: Vegetable Gardening', subtitle: 'Home & Garden', visibility: 'public', ago: 6, expires: 90, reactions: [{ u: 'zishan', emoji: '🌱', ago: 5 }] },
    { key: 'AE13', actor: 'kabir', eventType: 'friend_joined', subjectType: 'friendship', subject: 'FR_KA', title: 'Kabir and Abir are now friends', subtitle: '', visibility: 'friends', ago: 10, expires: 90 },
    { key: 'AE14', actor: 'abir', eventType: 'streak_milestone', subjectType: 'streak', subject: null, title: 'Abir hit a 7-day streak', subtitle: 'Learning', visibility: 'close_friends', ago: 8, expires: 90, reactions: [{ u: 'kabir', emoji: '🔥', ago: 7 }] },
    { key: 'AE15', actor: 'fahim', eventType: 'joined_group_session', subjectType: 'group_session', subject: 'GS6', title: 'Fahim joined: Desk-Yoga For Programmers', subtitle: 'Workshop', visibility: 'friends', ago: 1, expires: 90 },
    { key: 'AE16', actor: 'rakib', eventType: 'level_up', subjectType: 'badge', subject: null, title: 'Rakib reached level 3: Flame', subtitle: 'Keep it up!', visibility: 'friends', ago: 2, expires: 90 },
    { key: 'AE17', actor: 'arnob', eventType: 'skill_swap_accepted', subjectType: 'swap', subject: 'SW_RA_AR', title: 'Arnob accepted a skill swap with Rakib', subtitle: 'Digital Literacy <-> Web Design', visibility: 'friends', ago: 3, expires: 90 },
    { key: 'AE18', actor: 'abir', eventType: 'journal_highlight', subjectType: 'journal_highlight', subject: null, title: 'Abir highlighted a journal entry', subtitle: 'Spanish', visibility: 'close_friends', ago: 4, expires: 90 },
  ];
  for (const input of aeInputs) {
    AE[input.key] = OID();
    let subjectId: Types.ObjectId | undefined;
    if (input.subject) {
      subjectId = C[input.subject] ?? S[input.subject] ?? GS[input.subject] ?? F[input.subject] ?? SW[input.subject] ?? CH[input.subject] ?? R[input.subject] ?? undefined;
    }
    const createdAt = daysAgo(input.ago);
    await ActivityEvent.create({
      _id: AE[input.key], actorId: U[input.actor], eventType: input.eventType, subjectType: input.subjectType,
      subjectId, preview: { title: input.title, subtitle: input.subtitle }, visibility: input.visibility,
      reactions: (input.reactions ?? []).map((r: any) => ({ userId: U[r.u as UKey], emoji: r.emoji, createdAt: daysAgo(r.ago) })),
      commentCount: 0, expiresAt: new Date(createdAt.getTime() + input.expires * D), createdAt,
    });
  }
  console.log(`  ${aeInputs.length} activity events`);

  // ─── STREAKS ──────────────────────────────────────────────────────────────
  console.log('\n== Seeding streaks ==');
  await Streak.create([
    { userId: U.kabir, type: 'teaching', currentStreak: 10, longestStreak: 15, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(10), freezesUsed: 1, freezesAvailable: 2, milestones: [7] },
    { userId: U.kabir, type: 'learning', currentStreak: 18, longestStreak: 22, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(18), freezesUsed: 0, freezesAvailable: 2, milestones: [7, 14] },
    { userId: U.kabir, type: 'logging', currentStreak: 6, longestStreak: 10, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(6), freezesUsed: 1, freezesAvailable: 2, milestones: [] },
    { userId: U.abir, type: 'teaching', currentStreak: 8, longestStreak: 12, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(8), freezesUsed: 0, freezesAvailable: 2, milestones: [7] },
    { userId: U.abir, type: 'learning', currentStreak: 5, longestStreak: 9, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(5), freezesUsed: 0, freezesAvailable: 2, milestones: [] },
    { userId: U.zishan, type: 'teaching', currentStreak: 7, longestStreak: 7, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(7), freezesUsed: 0, freezesAvailable: 2, milestones: [7] },
    { userId: U.zishan, type: 'logging', currentStreak: 12, longestStreak: 12, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(12), freezesUsed: 0, freezesAvailable: 2, milestones: [7] },
    { userId: U.fahim, type: 'learning', currentStreak: 4, longestStreak: 6, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(4), freezesUsed: 0, freezesAvailable: 2, milestones: [] },
    { userId: U.fahim, type: 'teaching', currentStreak: 3, longestStreak: 3, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(3), freezesUsed: 0, freezesAvailable: 2, milestones: [] },
    { userId: U.rakib, type: 'teaching', currentStreak: 4, longestStreak: 5, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(4), freezesUsed: 0, freezesAvailable: 2, milestones: [] },
    { userId: U.rakib, type: 'learning', currentStreak: 2, longestStreak: 2, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(2), freezesUsed: 0, freezesAvailable: 2, milestones: [] },
    { userId: U.arnob, type: 'learning', currentStreak: 5, longestStreak: 5, lastActivityDate: daysAgo(1), streakStartDate: daysAgo(5), freezesUsed: 0, freezesAvailable: 2, milestones: [] },
    { userId: U.arnob, type: 'teaching', currentStreak: 2, longestStreak: 2, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(2), freezesUsed: 0, freezesAvailable: 2, milestones: [] },
  ]);
  console.log('  13 streaks');

  // ─── DIRECT MESSAGES ──────────────────────────────────────────────────────
  console.log('\n== Seeding direct messages ==');
  await DirectMessage.create([
    { senderId: U.kabir, recipientId: U.abir, content: 'Ready for our guitar session tomorrow?', readAt: daysAgo(1) },
    { senderId: U.abir, recipientId: U.kabir, content: 'Yes! Bring your capo.', readAt: daysAgo(1) },
    { senderId: U.kabir, recipientId: U.abir, content: 'See you at 6 PM.', readAt: undefined },
    { senderId: U.abir, recipientId: U.zishan, content: 'Thanks for the meditation tips today!', readAt: daysAgo(1) },
    { senderId: U.zishan, recipientId: U.abir, content: 'Anytime! Tell me how the breathing exercises go.', readAt: daysAgo(1) },
    { senderId: U.kabir, recipientId: U.zishan, content: 'Your chickpea stew recipe was amazing.', readAt: daysAgo(0) },
    { senderId: U.zishan, recipientId: U.kabir, content: 'I will send you the full recipe card tonight!', readAt: undefined },
    { senderId: U.fahim, recipientId: U.rakib, content: 'Coached my first client call in English - thank you!', readAt: daysAgo(0) },
    { senderId: U.rakib, recipientId: U.fahim, content: 'So proud of you. Rehearse it one more time tomorrow.', readAt: daysAgo(0) },
    { senderId: U.rakib, recipientId: U.arnob, content: 'The homepage looks fantastic, Arnob!', readAt: daysAgo(1) },
    { senderId: U.arnob, recipientId: U.rakib, content: 'Thanks! CSS color lesson next week.', readAt: daysAgo(1) },
    { senderId: U.zishan, recipientId: U.arnob, content: 'Your balcony chillies are almost ready to harvest!', readAt: daysAgo(2) },
    { senderId: U.arnob, recipientId: U.zishan, content: 'Come over for a stir-fry when they turn red.', readAt: daysAgo(2) },
    { senderId: U.kabir, recipientId: U.arnob, content: 'Great JS progress today - keep going!', readAt: daysAgo(0) },
  ]);
  console.log('  14 direct messages');

  // ─── SKILL JOURNALS ───────────────────────────────────────────────────────
  console.log('\n== Seeding skill journals ==');
  await SkillJournal.create([
    { userId: U.kabir, connectionId: C.AB_KA_1, prompt: 'What did you learn today?', content: 'Abir picked up composition rules really quickly. The golden-hour light for our walk was perfect.', mood: 5, isHighlighted: true },
    { userId: U.kabir, connectionId: C.KA_ZI_1, prompt: 'What went well?', content: 'Zishan showed me the trick to creamy hummus - the tahini ratio!', mood: 4, isHighlighted: false },
    { userId: U.abir, connectionId: C.KA_AB_1, prompt: 'How did the session go?', content: 'Kabir ordered coffee entirely in Spanish. We celebrated with churros.', mood: 5, isHighlighted: true },
    { userId: U.abir, connectionId: C.AB_ZI_1, prompt: 'Biggest takeaway?', content: 'The 4-7-8 breathing technique really works for focus before coding.', mood: 4, isHighlighted: false },
    { userId: U.zishan, connectionId: C.ZI_KA_1, prompt: 'What was the best part?', content: 'Kabir showed me how to use natural window light for food photography. A game changer for my blog!', mood: 5, isHighlighted: true },
    { userId: U.zishan, connectionId: C.ZI_AB_2, prompt: 'How did it feel?', content: 'I can play three chords now. Simple but it feels amazing.', mood: 4, isHighlighted: false },
    { userId: U.fahim, connectionId: C.FA_KA_1, prompt: 'Reflection', content: 'First portrait session with Kabir - my kids photos finally look as good as they do in real life.', mood: 5, isHighlighted: true },
    { userId: U.fahim, connectionId: C.FA_RA_1, prompt: 'Confidence check', content: 'Felt nervous but the call script carried me through. Rakib is a fantastic coach.', mood: 4, isHighlighted: false },
    { userId: U.rakib, connectionId: C.AR_RA_1, prompt: 'Teaching observation', content: 'Arnob picks up new concepts fast when I use analogies. Cloud backups now automated.', mood: 5, isHighlighted: false },
    { userId: U.arnob, connectionId: C.AR_RA_1, prompt: 'New skill', content: 'Cloud backup is finally automatic. Peace of mind is priceless.', mood: 4, isHighlighted: false },
    { userId: U.kabir, connectionId: C.FA_KA_1, prompt: 'Post-session note', content: 'Fahim asked great questions about catching candid moments. Eager to see his shots!', mood: 5, isHighlighted: false },
  ]);
  console.log('  11 skill journals');

  // ─── LEARNER REQUESTS ─────────────────────────────────────────────────────
  console.log('\n== Seeding learner requests ==');
  await LearnerRequest.create([
    { authorId: U.kabir, skillName: 'Guitar', categoryName: 'Music & Performing Arts', description: 'Want to play acoustic guitar songs by the fire at family gatherings.', city: 'dhaka', neighborhood: 'gulshan', format: 'in-person', availability: ['Weekends'], status: 'open', responsesCount: 1 },
    { authorId: U.abir, skillName: 'JavaScript', categoryName: 'Technology & Web', description: 'Trying to build a small portfolio site and need a mentor.', city: 'dhaka', neighborhood: 'banani', format: 'online', availability: ['Evenings'], status: 'open', responsesCount: 1 },
    { authorId: U.zishan, skillName: 'Photography', categoryName: 'Photography & Visual Arts', description: 'Want to take better food photos for my cooking blog.', city: 'dhaka', neighborhood: 'dhanmondi', format: 'in-person', availability: ['Weekends'], status: 'filled', responsesCount: 2 },
    { authorId: U.fahim, skillName: 'Healthy Cooking', categoryName: 'Food & Cooking', description: 'Want to cook healthier meals for my family on a budget.', city: 'dhaka', neighborhood: 'uttara', format: 'in-person', availability: ['Evenings'], status: 'open', responsesCount: 1 },
    { authorId: U.rakib, skillName: 'Yoga & Stretching', categoryName: 'Music & Performing Arts', description: 'Need gentle stretches for a stiff back from years of desk work.', city: 'dhaka', neighborhood: 'mirpur', format: 'in-person', availability: ['Mornings'], status: 'open', responsesCount: 0 },
    { authorId: U.arnob, skillName: 'Spanish', categoryName: 'Languages & Communication', description: 'Beginner Spanish for an upcoming trip to Mexico.', city: 'dhaka', neighborhood: 'motijheel', format: 'in-person', availability: ['Weekends'], status: 'open', responsesCount: 1 },
    { authorId: U.arnob, skillName: 'Guitar', categoryName: 'Music & Performing Arts', description: 'Totally new to music - want to learn simple songs.', city: 'dhaka', neighborhood: 'motijheel', format: 'in-person', availability: ['Evenings'], status: 'open', responsesCount: 0 },
  ]);
  console.log('  7 learner requests');

  // ─── SESSION NOTES ────────────────────────────────────────────────────────
  console.log('\n== Seeding session notes ==');
  await SessionNote.create([
    { connectionId: C.AB_KA_1, userId: U.kabir, content: 'Covered aperture, shutter speed and the rule of thirds. Abir did great with manual mode.' },
    { connectionId: C.KA_AB_1, userId: U.abir, content: 'Practised greetings and ordering food in Spanish. Kabir is a fast learner.' },
    { connectionId: C.ZI_KA_1, userId: U.kabir, content: 'Shot food photos with natural window light. Zishan learned composition basics for the blog.' },
    { connectionId: C.KA_ZI_1, userId: U.zishan, content: 'Made hummus, tabbouleh and a green smoothie. Kabir loved all three.' },
    { connectionId: C.ZI_AB_2, userId: U.abir, content: 'Taught open chords G, C and D. Zishan practised strumming patterns.' },
    { connectionId: C.AB_ZI_1, userId: U.zishan, content: 'Guided a 15-minute body scan. Abir said it improved focus for coding.' },
    { connectionId: C.FA_KA_1, userId: U.kabir, content: 'Kids-portrait session: catching genuine smiles. Fahim had a great eye for moments.' },
    { connectionId: C.FA_RA_1, userId: U.rakib, content: 'Client-call scenarios with a template script. Fahim will rehearse daily.' },
    { connectionId: C.FA_RA_2, userId: U.rakib, content: 'Set up password manager and automated cloud backups. Fahim is all set.' },
    { connectionId: C.AR_RA_1, userId: U.rakib, content: 'Covered cloud storage and backup strategy. Arnob set up automatic sync.' },
  ]);
  console.log('  10 session notes');

  // ─── TIPS ─────────────────────────────────────────────────────────────────
  console.log('\n== Seeding tips ==');
  await Tip.create([
    { payerId: U.abir, payeeId: U.kabir, connectionId: C.AB_KA_1, amount: 500, currency: 'usd', stripePaymentIntentId: 'pi_test_kabir_1', status: 'completed', platformFee: 50 },
    { payerId: U.kabir, payeeId: U.abir, connectionId: C.KA_AB_1, amount: 400, currency: 'usd', stripePaymentIntentId: 'pi_test_abir_1', status: 'completed', platformFee: 40 },
    { payerId: U.kabir, payeeId: U.zishan, connectionId: C.KA_ZI_1, amount: 300, currency: 'usd', stripePaymentIntentId: 'pi_test_zishan_1', status: 'completed', platformFee: 30 },
    { payerId: U.zishan, payeeId: U.kabir, connectionId: C.ZI_KA_1, amount: 350, currency: 'usd', status: 'pending', platformFee: 35 },
    { payerId: U.zishan, payeeId: U.abir, connectionId: C.ZI_AB_2, amount: 250, currency: 'usd', stripePaymentIntentId: 'pi_test_zishan_2', status: 'completed', platformFee: 25 },
    { payerId: U.fahim, payeeId: U.rakib, connectionId: C.FA_RA_1, amount: 200, currency: 'usd', stripePaymentIntentId: 'pi_test_rakib_1', status: 'completed', platformFee: 20 },
    { payerId: U.fahim, payeeId: U.kabir, connectionId: C.FA_KA_1, amount: 300, currency: 'usd', stripePaymentIntentId: 'pi_test_kabir_2', status: 'completed', platformFee: 30 },
    { payerId: U.arnob, payeeId: U.rakib, connectionId: C.AR_RA_1, amount: 250, currency: 'usd', status: 'failed', platformFee: 25 },
  ]);
  console.log('  8 tips');

  // ─── BLOCK OUT DATES ──────────────────────────────────────────────────────
  console.log('\n== Seeding block out dates ==');
  await BlockOutDate.create([
    { userId: U.kabir, date: daysFromNow(5), reason: 'Photography conference' },
    { userId: U.kabir, date: daysFromNow(12), reason: 'Weekend trip to Cox Bazar' },
    { userId: U.abir, date: daysFromNow(3), reason: 'Work deadline' },
    { userId: U.zishan, date: daysFromNow(7), reason: 'Family event' },
    { userId: U.fahim, date: daysFromNow(4), reason: 'Yoga teacher training' },
    { userId: U.rakib, date: daysFromNow(8), reason: 'Sewing workshop in Mirpur' },
  ]);
  console.log('  6 block out dates');

  // ─── SKILL SUGGESTIONS ────────────────────────────────────────────────────
  console.log('\n== Seeding skill suggestions ==');
  const SS: Record<string, Types.ObjectId> = {};
  await SkillSuggestion.create([
    { _id: (SS.SU1 = OID()), userId: U.kabir, skillName: 'Drone Photography', categoryName: 'Photography & Visual Arts', description: 'Aerial photography with consumer drones.', status: 'pending', votes: 2, votedBy: [U.kabir, U.abir] },
    { _id: (SS.SU2 = OID()), userId: U.abir, skillName: 'Ukulele', categoryName: 'Music & Performing Arts', description: 'Easy beginner instrument, great for songwriting.', status: 'approved', votes: 4, votedBy: [U.kabir, U.abir, U.zishan, U.fahim], reviewedAt: daysAgo(2) },
    { _id: (SS.SU3 = OID()), userId: U.zishan, skillName: 'Thai Cooking', categoryName: 'Food & Cooking', description: 'Curries, stir-fries and fresh herbs.', status: 'pending', votes: 3, votedBy: [U.zishan, U.kabir, U.rakib] },
    { _id: (SS.SU4 = OID()), userId: U.arnob, skillName: 'Budgeting Basics', categoryName: 'Languages & Communication', description: 'Everyday money skills for young adults.', status: 'rejected', votes: 1, votedBy: [U.arnob], reviewedBy: U.zishan, reviewedAt: daysAgo(5), adminNotes: 'Consider a better-fitting category.', votes: 1 },
  ]);
  console.log('  4 skill suggestions');

  // ─── SKILL BUNDLES ────────────────────────────────────────────────────────
  console.log('\n== Seeding skill bundles ==');
  const SB: Record<string, Types.ObjectId> = {};
  await SkillBundle.create([
    { _id: (SB.SB1 = OID()), name: 'Creative Starter Pack', description: 'Photography, music and cooking basics to kick off your journey.', skillIds: [S.K_PHOTO, S.A_GUITAR, S.Z_COOK], isOfficial: false, createdBy: U.kabir, votes: 5, votedBy: [U.kabir, U.abir, U.zishan, U.fahim, U.rakib], coverImage: '' },
    { _id: (SB.SB2 = OID()), name: 'Mind & Body Bundle', description: 'Meditation, yoga and healthy cooking for a calmer year.', skillIds: [S.Z_MEDITATE, S.F_YOGA, S.Z_COOK], isOfficial: false, createdBy: U.zishan, votes: 3, votedBy: [U.kabir, U.abir, U.rakib], coverImage: '' },
    { _id: (SB.SB3 = OID()), name: 'Digital Confidence Pack', description: 'Web, digital literacy and online safety basics.', skillIds: [S.ARN_WEB, S.R_DIGITAL, S.K_JS], isOfficial: false, createdBy: U.rakib, votes: 2, votedBy: [U.fahim, U.arnob], coverImage: '' },
  ]);
  console.log('  3 skill bundles');

  // ─── REQUEST TEMPLATES ───────────────────────────────────────────────────
  console.log('\n== Seeding request templates ==');
  await RequestTemplate.create([
    { title: 'Learn Photography', intro: "Hi! I'd love to learn photography from you.", body: 'I have a camera but need help with the basics. Are you available for a session this week?', categoryId: CAT.photo, categoryName: 'Photography & Visual Arts', isActive: true, createdBy: U.kabir },
    { title: 'Meditation Intro', intro: 'Hello! I want to start meditating.', body: 'I have never meditated before. Can you guide me through the basics over a video call?', categoryId: CAT.music, categoryName: 'Music & Performing Arts', isActive: true, createdBy: U.zishan },
    { title: 'Conversational English', intro: 'Hi there! I want to practise English.', body: 'I am comfortable reading but want to speak more confidently for work calls. Could we practise?', categoryId: CAT.lang, categoryName: 'Languages & Communication', isActive: true, createdBy: U.rakib },
    { title: 'Healthy Cooking', intro: 'Hello! I want to cook healthier meals.', body: 'I want to learn quick, balanced meals I can prep ahead for the week. Would you be able to help?', categoryId: CAT.food, categoryName: 'Food & Cooking', isActive: true, createdBy: U.zishan },
    { title: 'Web Design Basics', intro: 'Hey! I want to learn web design.', body: 'I would love to understand how to structure a simple webpage with HTML and CSS.', categoryId: CAT.tech, categoryName: 'Technology & Web', isActive: true, createdBy: U.arnob },
  ]);
  console.log('  5 request templates');

  // ─── SKILL DEMAND SNAPSHOTS ───────────────────────────────────────────────
  console.log('\n== Seeding skill demand snapshots ==');
  await SkillDemandSnapshot.create([
    { skills: [
      { skillName: 'Photography', categoryName: 'Photography & Visual Arts', demandScore: 85, topRegions: [{ name: 'Gulshan', count: 12 }, { name: 'Banani', count: 8 }] },
      { skillName: 'Spanish', categoryName: 'Languages & Communication', demandScore: 72, topRegions: [{ name: 'Banani', count: 7 }, { name: 'Dhanmondi', count: 5 }] },
      { skillName: 'JavaScript', categoryName: 'Technology & Web', demandScore: 68, topRegions: [{ name: 'Gulshan', count: 6 }, { name: 'Motijheel', count: 4 }] },
    ], windowStart: daysAgo(30), windowEnd: daysAgo(0) },
    { skills: [
      { skillName: 'Healthy Cooking', categoryName: 'Food & Cooking', demandScore: 78, topRegions: [{ name: 'Dhanmondi', count: 9 }, { name: 'Uttara', count: 7 }] },
      { skillName: 'Meditation', categoryName: 'Music & Performing Arts', demandScore: 64, topRegions: [{ name: 'Dhanmondi', count: 6 }, { name: 'Mirpur', count: 3 }] },
      { skillName: 'Yoga & Stretching', categoryName: 'Music & Performing Arts', demandScore: 60, topRegions: [{ name: 'Uttara', count: 5 }, { name: 'Mirpur', count: 4 }] },
    ], windowStart: daysAgo(14), windowEnd: daysAgo(0) },
  ]);
  console.log('  2 demand snapshots');

  // ─── SKILL RADARS ─────────────────────────────────────────────────────────
  console.log('\n== Seeding skill radars ==');
  await SkillRadar.create([
    { userId: U.kabir, signals: [
      { type: 'search', category: 'Music & Performing Arts', skillName: 'Guitar', timestamp: daysAgo(3), weight: 0.8 },
      { type: 'category_browse', category: 'Food & Cooking', timestamp: daysAgo(2), weight: 0.5 },
    ], intents: [
      { category: 'Music & Performing Arts', inferredSkillNames: ['Guitar', 'Ukulele'], confidence: 'high', preferredFormat: 'in-person', preferredRadius: 10, reasoning: 'Searched for guitar and browsed the music category', status: 'active', alertedSkillIds: [S.A_GUITAR], matchCount: 1 },
    ], manualRadars: [{ name: 'Nearby Spanish teachers', filters: { category: 'Languages & Communication', type: 'teach', format: 'in-person', radius: 10 }, alertedSkillIds: [S.A_SPANISH], matchCount: 1 }] },
    { userId: U.abir, signals: [
      { type: 'skill_view', category: 'Technology & Web', skillName: 'JavaScript', timestamp: daysAgo(1), weight: 0.7 },
      { type: 'endorsement_given', category: 'Food & Cooking', timestamp: daysAgo(2), weight: 0.4 },
    ], intents: [
      { category: 'Technology & Web', inferredSkillNames: ['JavaScript', 'Web Design'], confidence: 'medium', preferredFormat: 'online', reasoning: 'Viewed coding skills and endorsed a cooking teacher', status: 'active', alertedSkillIds: [S.K_JS], matchCount: 1 },
    ], manualRadars: [] },
    { userId: U.zishan, signals: [
      { type: 'search', category: 'Photography & Visual Arts', skillName: 'Photography', timestamp: daysAgo(0), weight: 0.9 },
      { type: 'skill_view', category: 'Music & Performing Arts', skillName: 'Guitar', timestamp: daysAgo(1), weight: 0.6 },
    ], intents: [
      { category: 'Photography & Visual Arts', inferredSkillNames: ['Photography', 'Food Photography'], confidence: 'high', preferredFormat: 'in-person', preferredRadius: 12, reasoning: 'Searched photography and viewed food-photo showcases', status: 'active', alertedSkillIds: [S.K_PHOTO], matchCount: 1 },
    ], manualRadars: [{ name: 'Guitar near Dhanmondi', filters: { category: 'Music & Performing Arts', type: 'teach', format: 'in-person', radius: 12 }, alertedSkillIds: [S.A_GUITAR], matchCount: 1 }] },
    { userId: U.fahim, signals: [
      { type: 'search', category: 'Food & Cooking', skillName: 'Healthy Cooking', timestamp: daysAgo(2), weight: 0.8 },
      { type: 'profile_view', category: 'Languages & Communication', timestamp: daysAgo(1), weight: 0.3 },
    ], intents: [
      { category: 'Food & Cooking', inferredSkillNames: ['Healthy Cooking', 'Meal Prep'], confidence: 'high', preferredFormat: 'in-person', preferredRadius: 20, reasoning: 'Searched healthy cooking and viewed a cooking profile', status: 'active', alertedSkillIds: [S.Z_COOK], matchCount: 1 },
    ], manualRadars: [{ name: 'English practice partners', filters: { category: 'Languages & Communication', format: 'online', radius: 20 }, alertedSkillIds: [S.R_ENGLISH], matchCount: 1 }] },
    { userId: U.rakib, signals: [
      { type: 'category_browse', category: 'Food & Cooking', timestamp: daysAgo(1), weight: 0.5 },
      { type: 'message_sent', category: 'Music & Performing Arts', timestamp: daysAgo(1), weight: 0.4 },
    ], intents: [
      { category: 'Music & Performing Arts', inferredSkillNames: ['Yoga', 'Stretching'], confidence: 'medium', preferredFormat: 'in-person', preferredRadius: 12, reasoning: 'Browsed food category and discussed stretching', status: 'active', alertedSkillIds: [S.F_YOGA], matchCount: 1 },
    ], manualRadars: [] },
    { userId: U.arnob, signals: [
      { type: 'search', category: 'Languages & Communication', skillName: 'Spanish', timestamp: daysAgo(0), weight: 0.9 },
      { type: 'skill_view', category: 'Music & Performing Arts', skillName: 'Guitar', timestamp: daysAgo(1), weight: 0.6 },
    ], intents: [
      { category: 'Languages & Communication', inferredSkillNames: ['Spanish', 'Conversational Language Practice'], confidence: 'high', preferredFormat: 'in-person', preferredRadius: 10, reasoning: 'Searched Spanish for travel', status: 'active', alertedSkillIds: [S.A_SPANISH], matchCount: 1 },
      { category: 'Music & Performing Arts', inferredSkillNames: ['Guitar'], confidence: 'medium', preferredFormat: 'in-person', reasoning: 'Viewed guitar lessons recently', status: 'active', alertedSkillIds: [S.A_GUITAR], matchCount: 1 },
    ], manualRadars: [{ name: 'Guitar teachers', filters: { category: 'Music & Performing Arts', type: 'teach', format: 'in-person', radius: 10 }, alertedSkillIds: [S.A_GUITAR], matchCount: 1 }] },
  ]);
  console.log('  6 skill radars');

  // ─── SWAP READY MATCHES ───────────────────────────────────────────────────
  console.log('\n== Seeding swap ready matches ==');
  const swapPairs = [
    { a: 'kabir', aSkill: 'K_JS', b: 'abir', bSkill: 'A_SPANISH', last: daysAgo(1), status: 'accepted' },
    { a: 'kabir', aSkill: 'K_PHOTO', b: 'zishan', bSkill: 'Z_COOK', last: daysAgo(2), status: 'proposed' },
    { a: 'abir', aSkill: 'A_GUITAR', b: 'zishan', bSkill: 'Z_MEDITATE', last: daysAgo(1), status: 'available' },
    { a: 'rakib', aSkill: 'R_DIGITAL', b: 'arnob', bSkill: 'ARN_WEB', last: daysAgo(3), status: 'accepted' },
    { a: 'fahim', aSkill: 'F_YOGA', b: 'rakib', bSkill: 'R_ENGLISH', last: daysAgo(1), status: 'available' },
    { a: 'zishan', aSkill: 'Z_MEDITATE', b: 'arnob', bSkill: 'ARN_GARDEN', last: daysAgo(0), status: 'available' },
    { a: 'kabir', aSkill: 'K_PHOTO', b: 'abir', bSkill: 'A_GUITAR', last: daysAgo(2), status: 'declined' },
  ];
  for (const m of swapPairs) {
    const uidA = String(U[m.a]);
    const uidB = String(U[m.b]);
    const { a, b } = canonicalPair(uidA, uidB);
    const aIsA = a === uidA;
    await SwapReadyMatch.updateOne(
      { userAId: new Types.ObjectId(a), userATeachesSkillId: aIsA ? S[m.aSkill] : S[m.bSkill], userBId: new Types.ObjectId(b), userBTeachesSkillId: aIsA ? S[m.bSkill] : S[m.aSkill] },
      { $setOnInsert: { status: m.status }, $set: { lastMatchDate: m.last } },
      { upsert: true },
    );
  }
  console.log(`  ${swapPairs.length} swap ready matches`);

  // ─── CONVERSATION SETTINGS ───────────────────────────────────────────────
  console.log('\n== Seeding conversation settings ==');
  const roomPairs: Array<[keyof typeof U, keyof typeof U, string]> = [
    ['kabir', 'abir', 'FR_KA'],
    ['kabir', 'zishan', 'FR_KZ'],
    ['kabir', 'fahim', 'FR_KF'],
    ['kabir', 'arnob', 'FR_KA2'],
    ['abir', 'zishan', 'FR_AZ'],
    ['abir', 'fahim', 'FR_AF'],
    ['zishan', 'rakib', 'FR_ZR'],
    ['zishan', 'fahim', 'FR_ZF'],
    ['zishan', 'arnob', 'FR_ZA'],
    ['fahim', 'rakib', 'FR_FR'],
    ['rakib', 'arnob', 'FR_RA'],
  ];
  const settings: any[] = [];
  roomPairs.forEach(([a, b], idx) => {
    const room = getDirectMessageRoomId(String(U[a]), String(U[b]));
    settings.push({ userId: U[a], conversationId: room, conversationType: 'friend', isPinned: idx === 0, pinnedAt: idx === 0 ? daysAgo(10) : undefined, isMuted: idx === 2, mutedUntil: idx === 2 ? daysFromNow(2) : undefined, isArchived: false, notificationOverride: idx === 1 ? 'all' : 'default', chatTheme: (['ocean', 'sunset', 'forest', 'midnight', 'default'] as const)[idx % 5] });
    settings.push({ userId: U[b], conversationId: room, conversationType: 'friend', isPinned: false, isMuted: false, isArchived: false, notificationOverride: 'default', chatTheme: 'default' });
  });
  await ConversationSettings.create(settings);
  console.log(`  ${settings.length} conversation settings`);

  // ─── USER INBOX PREFERENCES ──────────────────────────────────────────────
  console.log('\n== Seeding user inbox preferences ==');
  const prefInputs: Array<{ user: UKey; conn: string; pinned?: boolean; muted?: boolean; archived?: boolean; lastReadAt?: Date }> = [
    { user: 'kabir', conn: 'AB_KA_1', pinned: true, lastReadAt: daysAgo(0) },
    { user: 'kabir', conn: 'KA_AB_1', pinned: true, lastReadAt: daysAgo(0) },
    { user: 'kabir', conn: 'KA_ZI_1' },
    { user: 'abir', conn: 'AB_KA_1', lastReadAt: daysAgo(1) },
    { user: 'abir', conn: 'KA_AB_1' },
    { user: 'abir', conn: 'AB_ZI_1' },
    { user: 'zishan', conn: 'ZI_KA_1' },
    { user: 'zishan', conn: 'KA_ZI_1' },
    { user: 'zishan', conn: 'ZI_AB_1' },
    { user: 'zishan', conn: 'ZI_AB_2' },
    { user: 'fahim', conn: 'FA_KA_1', pinned: true },
    { user: 'fahim', conn: 'FA_ZI_1' },
    { user: 'fahim', conn: 'FA_RA_1', muted: true },
    { user: 'fahim', conn: 'FA_RA_2' },
    { user: 'rakib', conn: 'FA_RA_1' },
    { user: 'rakib', conn: 'FA_RA_2' },
    { user: 'rakib', conn: 'AR_RA_1' },
    { user: 'rakib', conn: 'RA_AR_1' },
    { user: 'arnob', conn: 'AR_RA_1' },
    { user: 'arnob', conn: 'RA_AR_1' },
    { user: 'arnob', conn: 'AR_KA_1' },
    { user: 'arnob', conn: 'AR_ZI_1' },
  ];
  for (const p of prefInputs) {
    await UserInboxPreference.create({
      userId: U[p.user], connectionId: C[p.conn], isPinned: p.pinned ?? false, isMuted: p.muted ?? false,
      isArchived: p.archived ?? false, lastReadAt: p.lastReadAt,
    });
  }
  console.log(`  ${prefInputs.length} inbox preferences`);

  // ─── REPORTS ──────────────────────────────────────────────────────────────
  console.log('\n== Seeding reports ==');
  const RPT: Record<string, Types.ObjectId> = {};
  await Report.create([
    { _id: (RPT.RP1 = OID()), reporterId: U.rakib, targetType: 'post', targetId: P.P4, reason: 'inappropriate', description: 'This post may be running a raffle without approval.', status: 'open' },
    { _id: (RPT.RP2 = OID()), reporterId: U.kabir, targetType: 'user', targetId: U.arnob, reason: 'other', description: 'Testing the report flow with seed data - no action required.', status: 'dismissed', action: 'no_action', resolution: 'Seed test report, no action needed.' },
    { _id: (RPT.RP3 = OID()), reporterId: U.abir, targetType: 'message', targetId: M.M36, reason: 'misleading', description: 'Edited-message demo report.', status: 'under_review', assignedTo: U.zishan },
    { _id: (RPT.RP4 = OID()), reporterId: U.fahim, targetType: 'review', targetId: R.RV_FA_RA_1, reason: 'other', description: 'Duplicate review - please verify.', status: 'resolved', action: 'no_action', resolution: 'Reviewed and confirmed original.' },
  ]);
  console.log('  4 reports');

  // ─── BLOCKS ───────────────────────────────────────────────────────────────
  console.log('\n== Seeding blocks ==');
  await Block.create([
    { blockerId: U.fahim, blockedId: U.arnob },
  ]);
  console.log('  1 block');

  // ─── AUDIT LOGS ───────────────────────────────────────────────────────────
  console.log('\n== Seeding audit logs ==');
  await AuditLog.create([
    { performedBy: U.kabir, action: 'update', targetType: 'skill', targetId: S.K_PHOTO, after: { description: 'Updated skill description' }, metadata: {} },
    { performedBy: U.abir, action: 'update', targetType: 'user', targetId: U.abir, after: { bio: 'Updated bio' }, metadata: {} },
    { performedBy: U.zishan, action: 'review', targetType: 'report', targetId: RPT.RP2, after: { action: 'no_action', status: 'dismissed' }, metadata: { source: 'seed' } },
    { performedBy: U.rakib, action: 'create', targetType: 'post', targetId: P.P8, after: { content: 'PSA: never reuse passwords' }, metadata: {} },
    { performedBy: U.kabir, action: 'update', targetType: 'category', targetId: CAT.food, after: { displayOrder: 1 }, metadata: {} },
    { performedBy: U.arnob, action: 'create', targetType: 'review', targetId: R.RV_AR_RA_1, after: { rating: 4 }, metadata: {} },
  ]);
  console.log('  6 audit logs');

  // ─── AUTH TOKENS & SECURITY RECORDS ───────────────────────────────────────
  console.log('\n== Seeding auth tokens & security records ==');
  await RefreshToken.create([
    { userId: U.kabir, tokenHash: 'hashed_refresh_kabir', expiresAt: daysFromNow(30) },
    { userId: U.abir, tokenHash: 'hashed_refresh_abir', expiresAt: daysFromNow(30) },
    { userId: U.zishan, tokenHash: 'hashed_refresh_zishan', expiresAt: daysFromNow(30) },
    { userId: U.fahim, tokenHash: 'hashed_refresh_fahim', expiresAt: daysAgo(1), revokedAt: daysAgo(1) },
    { userId: U.rakib, tokenHash: 'hashed_refresh_rakib', expiresAt: daysFromNow(30) },
    { userId: U.arnob, tokenHash: 'hashed_refresh_arnob', expiresAt: daysFromNow(30) },
  ]);
  await EmailVerificationToken.create([
    { userId: U.kabir, tokenHash: 'hashed_verify_kabir', expiresAt: daysAgo(10), isUsed: true },
    { userId: U.abir, tokenHash: 'hashed_verify_abir', expiresAt: daysAgo(8), isUsed: true },
    { userId: U.zishan, tokenHash: 'hashed_verify_zishan', expiresAt: daysAgo(5), isUsed: true },
    { userId: U.fahim, tokenHash: 'hashed_verify_fahim', expiresAt: daysAgo(3), isUsed: true },
    { userId: U.rakib, tokenHash: 'hashed_verify_rakib', expiresAt: daysAgo(2), isUsed: true },
    { userId: U.arnob, tokenHash: 'hashed_verify_arnob', expiresAt: daysAgo(1), isUsed: true },
  ]);
  await PasswordResetToken.create([
    { userId: U.kabir, tokenHash: 'hashed_reset_kabir', expiresAt: daysFromNow(1) },
    { userId: U.abir, tokenHash: 'hashed_reset_abir', expiresAt: daysAgo(3), isUsed: true },
    { userId: U.zishan, tokenHash: 'hashed_reset_zishan', expiresAt: daysAgo(1), isUsed: true },
  ]);
  await OAuthProvider.create([
    { userId: U.kabir, provider: 'google', providerUserId: 'google_kabir_001', email: EMAILS.kabir, displayName: 'Kabir Hossain' },
    { userId: U.abir, provider: 'google', providerUserId: 'google_abir_002', email: EMAILS.abir, displayName: 'Abir Rahman' },
    { userId: U.zishan, provider: 'google', providerUserId: 'google_zishan_003', email: EMAILS.zishan, displayName: 'Zishan Ahmed' },
    { userId: U.fahim, provider: 'apple', providerUserId: 'apple_fahim_004', email: EMAILS.fahim, displayName: 'Fahim Chowdhury' },
    { userId: U.rakib, provider: 'google', providerUserId: 'google_rakib_005', email: EMAILS.rakib, displayName: 'Rakib Hasan' },
    { userId: U.arnob, provider: 'apple', providerUserId: 'apple_arnob_006', email: EMAILS.arnob, displayName: 'Arnob Mojumder' },
  ]);
  await TwoFactorSecret.create([
    { userId: U.kabir, secret: 'JBSWY3DPEHPK3PXP', enabled: true, lastUsedAt: daysAgo(1) },
    { userId: U.abir, secret: 'KRSXG5CTMVRXEZLU', enabled: true, lastUsedAt: daysAgo(3) },
    { userId: U.zishan, secret: 'GEZDGNBVGY3TQOJQ', enabled: false },
  ]);
  await TokenBlacklist.create([
    { tokenId: 'jti_blacklisted_kabir_access', type: 'access', expiresAt: daysFromNow(1) },
    { tokenId: 'jti_blacklisted_fahim_refresh', type: 'refresh', expiresAt: daysFromNow(30) },
    { tokenId: 'jti_blacklisted_abir_access', type: 'access', expiresAt: daysFromNow(1) },
  ]);
  console.log('  auth tokens seeded');

  // ─── FINALIZE: RECOMPUTE STATS & COUNTS FROM ACTUAL DATA ─────────────────
  console.log('\n== Finalizing stats (recomputed from actual data) ==');

  const allUserIds = Object.values(U);

  // skill stats
  const reviewAgg = await Review.aggregate([
    { $match: { skillId: { $in: Object.values(S) } } },
    { $group: { _id: '$skillId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const skillReviewMap = new Map(reviewAgg.map((r) => [String(r._id), { avg: r.avg, count: r.count }]));
  const completedBySkill = await Connection.aggregate([
    { $match: { status: 'completed', skillId: { $in: Object.values(S) } } },
    { $group: { _id: '$skillId', n: { $sum: 1 } } },
  ]);
  const skillCompleted = new Map(completedBySkill.map((r) => [String(r._id), r.n]));
  for (const [key, skillId] of Object.entries(S)) {
    const reviewInfo = skillReviewMap.get(String(skillId));
    await Skill.updateOne({ _id: skillId }, { $set: { 'stats.reviewCount': reviewInfo?.count ?? 0, 'stats.averageRating': reviewInfo?.avg ?? 0, 'stats.completedSessionCount': skillCompleted.get(String(skillId)) ?? 0 } });
    void key;
  }

  // course enrollment counts
  const enrollByCourse = await CourseEnrollment.aggregate([
    { $match: { courseId: { $in: Object.values(CR) } } },
    { $group: { _id: '$courseId', n: { $sum: 1 } } },
  ]);
  for (const e of enrollByCourse) await Course.updateOne({ _id: e._id }, { $set: { enrollmentCount: e.n } });

  // group session max check: participants must not exceed max
  const gsDocs = await GroupSession.find({ _id: { $in: Object.values(GS) } }).lean();
  for (const g of gsDocs) {
    if (g.participants.length >= g.maxParticipants && g.status === 'open') {
      await GroupSession.updateOne({ _id: g._id }, { $set: { status: 'full' } });
    }
  }

  // user stats (reviews received + completed sessions taught)
  const userReviewAgg = await Review.aggregate([
    { $match: { revieweeId: { $in: allUserIds } } },
    { $group: { _id: '$revieweeId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const userReviewMap = new Map(userReviewAgg.map((r) => [String(r._id), { avg: r.avg, count: r.count }]));
  const taughtAgg = await Connection.aggregate([
    { $match: { status: 'completed', teacherId: { $in: allUserIds } } },
    { $group: { _id: '$teacherId', n: { $sum: 1 } } },
  ]);
  const taughtCount = new Map(taughtAgg.map((r) => [String(r._id), r.n]));
  const learnedAgg = await Connection.aggregate([
    { $match: { status: 'completed', requesterId: { $in: allUserIds } } },
    { $group: { _id: '$requesterId', n: { $sum: 1 } } },
  ]);
  const learnedCount = new Map(learnedAgg.map((r) => [String(r._id), r.n]));

  for (const [key, userId] of Object.entries(U)) {
    const reviewInfo = userReviewMap.get(String(userId));
    const taught = taughtCount.get(String(userId)) ?? 0;
    const learned = learnedCount.get(String(userId)) ?? 0;
    await User.updateOne({ _id: userId }, { $set: {
      'stats.sessionsCompleted': taught + learned,
      'stats.averageRating': reviewInfo?.avg ?? 0,
      'stats.reviewCount': reviewInfo?.count ?? 0,
    }});
    void key;
  }

  // consistency pass: friendIds derived from accepted friendships
  const friendAgg = await Friendship.aggregate([
    { $match: { status: 'accepted', $and: [{ requesterId: { $in: allUserIds } }, { addresseeId: { $in: allUserIds } }] } },
  ]);
  const adj = new Map<string, string[]>();
  for (const f of friendAgg) {
    const a = String(f.requesterId); const b = String(f.addresseeId);
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(b); adj.get(b)!.push(a);
  }
  for (const [key, userId] of Object.entries(U)) {
    await User.updateOne({ _id: userId }, { $set: { friendIds: (adj.get(String(userId)) ?? []).map((id) => new Types.ObjectId(id)) } });
  }

  // community post scores
  const posts = await CommunityPost.find({ authorId: { $in: allUserIds } }).lean();
  for (const p of posts) {
    const score = (p.userVotes ?? []).reduce((acc, v) => acc + (v.vote === 'up' ? 1 : -1), 0);
    await CommunityPost.updateOne({ _id: p._id }, { $set: { voteScore: score } });
  }

  // leaderboard-style sorting friendly: lastActive today for all six
  await User.updateMany({ _id: { $in: allUserIds } }, { $set: { lastActive: new Date() } });

  console.log('\n== Done ==');
  await disconnectDatabase();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});