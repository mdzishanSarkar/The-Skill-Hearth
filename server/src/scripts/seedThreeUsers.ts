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
  SkillRadar,
  SwapReadyMatch,
  SkillDemandSnapshot,
  ConversationSettings,
  UserInboxPreference,
} from '../models';

const PASSWORD = 'Demo1234!';
const H = 3600 * 1000;
const D = 24 * H;
const daysAgo = (n: number) => new Date(Date.now() - n * D);
const daysFromNow = (n: number) => new Date(Date.now() + n * D);
const OID = () => new Types.ObjectId();

const EMAIL_SIMON = 'simoksimon147@gmail.com';
const EMAIL_ALEX = 'partoftech150@gmail.com';
const EMAIL_JORDAN = 'ah5329246@gmail.com';

const DHAKA: [number, number] = [90.4125, 23.8103];
const GULSHAN: [number, number] = [90.4135, 23.7933];
const BANANI: [number, number] = [90.4092, 23.785];
const DHANMONDI: [number, number] = [90.375, 23.7461];
const SIMON_LOCATION = { city: 'dhaka', zipCode: '1207', neighborhood: 'Gulshan', type: 'Point' as const, coordinates: GULSHAN, radiusPreference: 15 };
const ALEX_LOCATION = { city: 'dhaka', zipCode: '1207', neighborhood: 'Banani', type: 'Point' as const, coordinates: BANANI, radiusPreference: 15 };
const JORDAN_LOCATION = { city: 'dhaka', zipCode: '1207', neighborhood: 'Dhanmondi', type: 'Point' as const, coordinates: DHANMONDI, radiusPreference: 12 };

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

async function findUser(email: string): Promise<Types.ObjectId> {
  const user = await User.findOne({ email }).select('_id').lean();
  if (!user) throw new Error(`Test user not found: ${email}`);
  return user._id;
}

async function findCategoryId(slug: string): Promise<{ _id: Types.ObjectId; name: string }> {
  const cat = await Category.findOne({ slug }).lean();
  if (!cat) throw new Error(`Missing category: ${slug}`);
  return { _id: cat._id, name: cat.name };
}

function canonicalPair(a: string, b: string): { a: string; b: string } {
  return a < b ? { a, b } : { a: b, b: a };
}

async function main(): Promise<void> {
  await connectDatabase();

  console.log('\n== Ensuring categories ==');
  await seedCategories();
  const photoCat = await findCategoryId('photography-visual');
  const techCat = await findCategoryId('technology-web');
  const musicCat = await findCategoryId('music-arts');
  const langCat = await findCategoryId('languages-communication');
  const foodCat = await findCategoryId('food-cooking');
  const gardenCat = await findCategoryId('home-garden');
  const craftCat = await findCategoryId('textile-craft');
  const digitalCat = await findCategoryId('digital-literacy');
  const wellnessCat = musicCat;
  const categories = await Category.find({ isActive: true }).lean();
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));

  console.log('\n== Finding users ==');
  const simonId = await findUser(EMAIL_SIMON);
  const alexId = await findUser(EMAIL_ALEX);
  const jordanId = await findUser(EMAIL_JORDAN);
  const allIds = [simonId, alexId, jordanId];
  console.log(`  Simon: ${simonId}`);
  console.log(`  Alex: ${alexId}`);
  console.log(`  Jordan: ${jordanId}`);

  console.log('\n== Cleaning existing data for these users ==');
  await Skill.deleteMany({ userId: { $in: allIds } });
  await Notification.deleteMany({ userId: { $in: allIds } });
  const existingConns = await Connection.find({
    $or: [{ requesterId: { $in: allIds } }, { teacherId: { $in: allIds } }],
  }).select('_id').lean();
  const connIds = existingConns.map((c) => c._id);
  await Message.deleteMany({ $or: [{ connectionId: { $in: connIds } }, { senderId: { $in: allIds } }] });
  await Connection.deleteMany({ $or: [{ requesterId: { $in: allIds } }, { teacherId: { $in: allIds } }] });
  await Review.deleteMany({ $or: [{ reviewerId: { $in: allIds } }, { revieweeId: { $in: allIds } }] });
  await Friendship.deleteMany({ $or: [{ requesterId: { $in: allIds } }, { addresseeId: { $in: allIds } }] });
  await SwapReadyMatch.deleteMany({ $or: [{ userAId: { $in: allIds } }, { userBId: { $in: allIds } }] });
  await Report.deleteMany({ reporterId: { $in: allIds } });
  await CommunityPost.deleteMany({ authorId: { $in: allIds } });
  await Endorsement.deleteMany({ $or: [{ endorserId: { $in: allIds } }, { endorseeId: { $in: allIds } }] });
  await SavedSearch.deleteMany({ userId: { $in: allIds } });
  await GroupSession.deleteMany({ $or: [{ teacherId: { $in: allIds } }, { participants: { $in: allIds } }] });
  await Course.deleteMany({ teacherId: { $in: allIds } });
  await CourseEnrollment.deleteMany({ learnerId: { $in: allIds } });
  await Challenge.deleteMany({ creatorId: { $in: allIds } });
  await Mentorship.deleteMany({ $or: [{ mentorId: { $in: allIds } }, { menteeId: { $in: allIds } }] });
  await Showcase.deleteMany({ userId: { $in: allIds } });
  await Webhook.deleteMany({ ownerId: { $in: allIds } });
  await ApiKey.deleteMany({ ownerId: { $in: allIds } });
  await CalendarIntegration.deleteMany({ userId: { $in: allIds } });
  await BotInstallation.deleteMany({ installedBy: { $in: allIds } });
  await ActivityEvent.deleteMany({ actorId: { $in: allIds } });
  await Streak.deleteMany({ userId: { $in: allIds } });
  await DirectMessage.deleteMany({ $or: [{ senderId: { $in: allIds } }, { recipientId: { $in: allIds } }] });
  await SkillJournal.deleteMany({ userId: { $in: allIds } });
  await LearnerRequest.deleteMany({ authorId: { $in: allIds } });
  await SessionNote.deleteMany({ userId: { $in: allIds } });
  await Tip.deleteMany({ $or: [{ payerId: { $in: allIds } }, { payeeId: { $in: allIds } }] });
  await BlockOutDate.deleteMany({ userId: { $in: allIds } });
  await SkillSuggestion.deleteMany({ userId: { $in: allIds } });
  await SkillBundle.deleteMany({ createdBy: { $in: allIds } });
  await AuditLog.deleteMany({ performedBy: { $in: allIds } });
  await SkillRadar.deleteMany({ userId: { $in: allIds } });
  await ConversationSettings.deleteMany({ userId: { $in: allIds } });
  await UserInboxPreference.deleteMany({ userId: { $in: allIds } });
  await RefreshToken.deleteMany({ userId: { $in: allIds } });
  await EmailVerificationToken.deleteMany({ userId: { $in: allIds } });
  await PasswordResetToken.deleteMany({ userId: { $in: allIds } });
  await OAuthProvider.deleteMany({ userId: { $in: allIds } });
  await TwoFactorSecret.deleteMany({ userId: { $in: allIds } });
  await TokenBlacklist.deleteMany({});
  await SkillDemandSnapshot.deleteMany({});
  await Block.deleteMany({ $or: [{ blockerId: { $in: allIds } }, { blockedId: { $in: allIds } }] });
  await SkillSwap.deleteMany({ $or: [{ userAId: { $in: allIds } }, { userBId: { $in: allIds } }] });
  console.log('  cleaned');

  console.log('\n== Updating profiles ==');
  const simonLevel = getLevelForXp(1800);
  const alexLevel = getLevelForXp(1400);
  const jordanLevel = getLevelForXp(950);
  const SIMON_BADGES = ['first_spark', 'full_profile', 'ready_to_share', 'first_session', 'first_friend', 'skill_swapper', 'five_star_debut', 'multi_skill', 'early_adopter', 'streak_7', 'streak_30', 'ten_sessions', 'local_legend'];
  const ALEX_BADGES = ['first_spark', 'full_profile', 'first_session', 'first_friend', 'skill_swapper', 'five_star_debut', 'early_adopter', 'streak_7', 'ten_sessions'];
  const JORDAN_BADGES = ['first_spark', 'full_profile', 'first_session', 'first_friend', 'skill_swapper', 'early_adopter'];

  await User.updateOne({ _id: simonId }, { $set: {
    displayName: 'Simon K.', bio: 'Photographer and JavaScript developer. I love teaching and learning through the Skill Hearth community. Always up for a skill swap!',
    location: SIMON_LOCATION, availability: EVENINGS, showOnMap: true,
    stats: { sessionsCompleted: 22, averageRating: 4.8, reviewCount: 9 },
    gamification: { xp: 1800, level: simonLevel.level, badges: SIMON_BADGES, streakFreezeAvailable: 2, referralCode: 'SIMON-SH01' },
    friendIds: [alexId, jordanId], closeFriendIds: [alexId],
    isEmailVerified: true, hasCompletedOnboarding: true, lastActive: daysAgo(0),
    feedVisibility: 'friends' as const, weeklyDigest: true,
    quietHours: { enabled: false, startTime: '23:00', endTime: '07:00', timezone: 'Asia/Dhaka' },
  }});

  await User.updateOne({ _id: alexId }, { $set: {
    displayName: 'Alex T.', bio: 'Spanish teacher, guitarist, and photography enthusiast. Currently learning JavaScript. Happy to swap skills!',
    location: ALEX_LOCATION, availability: EVENINGS, showOnMap: true,
    stats: { sessionsCompleted: 16, averageRating: 4.6, reviewCount: 7 },
    gamification: { xp: 1400, level: alexLevel.level, badges: ALEX_BADGES, streakFreezeAvailable: 2, referralCode: 'ALEX-SH02' },
    friendIds: [simonId, jordanId], closeFriendIds: [simonId],
    isEmailVerified: true, hasCompletedOnboarding: true, lastActive: daysAgo(0),
    feedVisibility: 'public' as const, weeklyDigest: true,
    quietHours: { enabled: false, startTime: '23:00', endTime: '07:00', timezone: 'Asia/Dhaka' },
  }});

  await User.updateOne({ _id: jordanId }, { $set: {
    displayName: 'Jordan M.', bio: 'Wellness coach and cooking lover. Teaching meditation and healthy cooking. Currently learning photography and guitar.',
    location: JORDAN_LOCATION, availability: FLEXIBLE, showOnMap: true,
    stats: { sessionsCompleted: 8, averageRating: 4.4, reviewCount: 4 },
    gamification: { xp: 950, level: jordanLevel.level, badges: JORDAN_BADGES, streakFreezeAvailable: 2, referralCode: 'JORD-SH03' },
    friendIds: [simonId, alexId], closeFriendIds: [],
    isEmailVerified: true, hasCompletedOnboarding: true, lastActive: daysAgo(0),
    feedVisibility: 'friends' as const, weeklyDigest: false,
    quietHours: { enabled: true, startTime: '22:00', endTime: '08:00', timezone: 'Asia/Dhaka' },
  }});
  console.log('  profiles updated');

  // ─── SKILLS ──────────────────────────────────────────────────────────
  console.log('\n== Seeding skills ==');
  const S: Record<string, Types.ObjectId> = {};
  const skillDefs: any[] = [
    { key: 'SIMON_PHOTO', userId: simonId, type: 'teach', cat: photoCat, name: 'Photography', desc: 'Composition, lighting, and the rule of thirds. I shoot street and portrait photography.', prof: 'advanced', format: 'in-person', len: '1hr', stats: { averageRating: 4.9, reviewCount: 4, completedSessionCount: 7 } },
    { key: 'SIMON_JS', userId: simonId, type: 'teach', cat: techCat, name: 'JavaScript', desc: 'Web development fundamentals from variables to building interactive pages.', prof: 'advanced', format: 'online', len: '2hr+', stats: { averageRating: 4.7, reviewCount: 3, completedSessionCount: 5 } },
    { key: 'SIMON_SPANISH_LEARN', userId: simonId, type: 'learn', cat: langCat, name: 'Spanish', desc: 'Want to hold a real conversation in Spanish. Beginner level.', prof: 'beginner', format: 'in-person', len: '1hr' },
    { key: 'SIMON_GUITAR_LEARN', userId: simonId, type: 'learn', cat: musicCat, name: 'Guitar', desc: 'Want to learn acoustic guitar from zero.', prof: 'beginner', format: 'in-person', len: '1hr' },
    { key: 'SIMON_COOK_LEARN', userId: simonId, type: 'learn', cat: foodCat, name: 'Healthy Cooking', desc: 'Want to learn Mediterranean-style healthy cooking.', prof: 'beginner', format: 'in-person', len: '2hr+' },

    { key: 'ALEX_PHOTO', userId: alexId, type: 'teach', cat: photoCat, name: 'Photography', desc: 'Shoot with confidence, understand light and composition, edit like a pro.', prof: 'intermediate', format: 'in-person', len: '1hr', stats: { averageRating: 4.5, reviewCount: 3, completedSessionCount: 6 } },
    { key: 'ALEX_SPANISH', userId: alexId, type: 'teach', cat: langCat, name: 'Spanish', desc: 'Conversational Spanish for everyday life. We practice speaking from day one.', prof: 'intermediate', format: 'in-person', len: '1hr', stats: { averageRating: 4.6, reviewCount: 4, completedSessionCount: 7 } },
    { key: 'ALEX_GUITAR', userId: alexId, type: 'teach', cat: musicCat, name: 'Guitar', desc: 'Acoustic guitar basics: chords, strumming and your first songs.', prof: 'intermediate', format: 'in-person', len: '1hr', stats: { averageRating: 4.5, reviewCount: 2, completedSessionCount: 4 } },
    { key: 'ALEX_JS_LEARN', userId: alexId, type: 'learn', cat: techCat, name: 'JavaScript', desc: 'Want to learn JavaScript and build my own projects.', prof: 'beginner', format: 'online', len: '2hr+' },
    { key: 'ALEX_COOK_LEARN', userId: alexId, type: 'learn', cat: foodCat, name: 'Healthy Cooking', desc: 'Learning to meal-prep healthy lunches for the work week.', prof: 'beginner', format: 'either', len: '2hr+' },

    { key: 'JORDAN_PHOTO_LEARN', userId: jordanId, type: 'learn', cat: photoCat, name: 'Photography', desc: 'Want to take better food and nature photos.', prof: 'beginner', format: 'in-person', len: '1hr' },
    { key: 'JORDAN_COOK', userId: jordanId, type: 'teach', cat: foodCat, name: 'Healthy Cooking', desc: 'Mediterranean and plant-based meal prep, smoothies and salads.', prof: 'intermediate', format: 'in-person', len: '2hr+', stats: { averageRating: 4.5, reviewCount: 2, completedSessionCount: 4 } },
    { key: 'JORDAN_MEDITATE', userId: jordanId, type: 'teach', cat: wellnessCat, name: 'Meditation', desc: 'Guided meditation and mindfulness for stress relief and focus.', prof: 'intermediate', format: 'online', len: '1hr', stats: { averageRating: 4.3, reviewCount: 2, completedSessionCount: 3 } },
    { key: 'JORDAN_GUITAR_LEARN', userId: jordanId, type: 'learn', cat: musicCat, name: 'Guitar', desc: 'Want to play acoustic guitar for personal enjoyment.', prof: 'beginner', format: 'in-person', len: '1hr' },
    { key: 'JORDAN_JS_LEARN', userId: jordanId, type: 'learn', cat: techCat, name: 'JavaScript', desc: 'Curious about coding. Want to learn the basics.', prof: 'beginner', format: 'online', len: '2hr+' },
  ];

  for (const def of skillDefs) {
    const id = OID();
    S[def.key] = id;
    const media: Record<string, unknown>[] = [];
    await Skill.create({
      _id: id, userId: def.userId, type: def.type, categoryId: def.cat._id, categoryName: def.cat.name,
      skillName: def.name, description: def.desc, proficiencyLevel: def.prof, format: def.format,
      sessionLength: def.len, isActive: true, isDeleted: false, media,
      location: {
        city: 'dhaka', zipCode: def.userId.equals(simonId) ? '1207' : def.userId.equals(alexId) ? '1207' : '1207',
        neighborhood: def.userId.equals(simonId) ? 'Gulshan' : def.userId.equals(alexId) ? 'Banani' : 'Dhanmondi',
        type: 'Point', coordinates: def.userId.equals(simonId) ? GULSHAN : def.userId.equals(alexId) ? BANANI : DHANMONDI, radiusPreference: def.userId.equals(jordanId) ? 12 : 15,
      },
      stats: def.stats ?? { averageRating: 0, reviewCount: 0, completedSessionCount: 0 },
    });
    console.log(`  skill: ${def.key}`);
  }

  // ─── CONNECTIONS ─────────────────────────────────────────────────────
  console.log('\n== Seeding connections ==');
  const C: Record<string, Types.ObjectId> = {};
  const connInputs: any[] = [
    { key: 'SA1', requester: alexId, teacher: simonId, skill: 'SIMON_PHOTO', status: 'completed', message: 'I would love to learn photography from you!', responseMessage: 'Great! Let us start with the basics.', proposedFormat: 'in-person', completedAt: daysAgo(14), createdAt: daysAgo(21) },
    { key: 'SA2', requester: simonId, teacher: alexId, skill: 'ALEX_SPANISH', status: 'completed', message: 'I would love to learn Spanish.', responseMessage: 'Perfect, we will start from the beginning.', proposedFormat: 'in-person', completedAt: daysAgo(7), createdAt: daysAgo(14) },
    { key: 'SA3', requester: simonId, teacher: alexId, skill: 'ALEX_GUITAR', status: 'accepted', message: 'I have always wanted to play guitar!', responseMessage: 'Absolutely! Bring your guitar.', proposedFormat: 'in-person', createdAt: daysAgo(4) },
    { key: 'SA4', requester: alexId, teacher: simonId, skill: 'SIMON_JS', status: 'accepted', message: 'I want to learn JavaScript.', responseMessage: 'We can meet online.', proposedFormat: 'online', createdAt: daysAgo(2) },
    { key: 'SJ1', requester: jordanId, teacher: simonId, skill: 'SIMON_PHOTO', status: 'completed', message: 'I want to take better food photos.', responseMessage: 'Happy to help! Bring your camera.', proposedFormat: 'in-person', completedAt: daysAgo(5), createdAt: daysAgo(10) },
    { key: 'SJ2', requester: simonId, teacher: jordanId, skill: 'JORDAN_COOK', status: 'completed', message: 'Teach me healthy cooking!', responseMessage: 'Let us start with a salad recipe.', proposedFormat: 'in-person', completedAt: daysAgo(3), createdAt: daysAgo(8) },
    { key: 'SJ3', requester: simonId, teacher: jordanId, skill: 'JORDAN_MEDITATE', status: 'accepted', message: 'I want to try meditation.', responseMessage: 'Great! Let us start with breathing.', proposedFormat: 'online', createdAt: daysAgo(1) },
    { key: 'AJ1', requester: jordanId, teacher: alexId, skill: 'ALEX_GUITAR', status: 'completed', message: 'I want to learn guitar chords!', responseMessage: 'We can start with open chords.', proposedFormat: 'in-person', completedAt: daysAgo(4), createdAt: daysAgo(9) },
    { key: 'AJ2', requester: alexId, teacher: jordanId, skill: 'JORDAN_MEDITATE', status: 'completed', message: 'Meditation for focus?', responseMessage: 'Absolutely, we will do a 15-min guided session.', proposedFormat: 'online', completedAt: daysAgo(2), createdAt: daysAgo(6) },
    { key: 'AJ3', requester: jordanId, teacher: alexId, skill: 'ALEX_SPANISH', status: 'pending', message: 'I want to learn conversational Spanish.', proposedFormat: 'in-person', createdAt: daysAgo(1) },
  ];
  for (const input of connInputs) {
    C[input.key] = OID();
    await Connection.create({
      _id: C[input.key], requesterId: input.requester, teacherId: input.teacher, skillId: S[input.skill],
      status: input.status, message: input.message, responseMessage: input.responseMessage,
      proposedFormat: input.proposedFormat, completedAt: input.completedAt,
      createdAt: input.createdAt ?? daysAgo(5),
    });
    console.log(`  connection: ${input.key}`);
  }

  // ─── MESSAGES ────────────────────────────────────────────────────────
  console.log('\n== Seeding messages ==');
  const M: Record<string, Types.ObjectId> = {};
  const msgInputs: any[] = [
    { key: 'M_SA1_1', conn: 'SA1', sender: alexId, content: 'Hey Simon! So excited to start learning photography.', createdAt: daysAgo(20) },
    { key: 'M_SA1_2', conn: 'SA1', sender: simonId, content: 'Welcome! Do you have a DSLR or mirrorless?', createdAt: daysAgo(20) },
    { key: 'M_SA1_3', conn: 'SA1', sender: alexId, content: 'I have a Canon EOS M50.', createdAt: daysAgo(19) },
    { key: 'M_SA1_4', conn: 'SA1', sender: simonId, content: 'Perfect! Let us start with aperture and shutter speed this weekend.', createdAt: daysAgo(19) },
    { key: 'M_SA2_1', conn: 'SA2', sender: simonId, content: 'Hey Alex! Ready for our Spanish session?', createdAt: daysAgo(13) },
    { key: 'M_SA2_2', conn: 'SA2', sender: alexId, content: 'Yes! I have been practicing greetings.', createdAt: daysAgo(13) },
    { key: 'M_SA2_3', conn: 'SA2', sender: simonId, content: 'Awesome. We will do a role-play at the cafe.', createdAt: daysAgo(12) },
    { key: 'M_SA2_4', conn: 'SA2', sender: alexId, content: 'See you Saturday at 4 PM!', createdAt: daysAgo(12) },
    { key: 'M_SA3_1', conn: 'SA3', sender: simonId, content: 'I have been practicing the G and C chords.', createdAt: daysAgo(3) },
    { key: 'M_SA3_2', conn: 'SA3', sender: alexId, content: 'Nice! Next we will add D and Em.', createdAt: daysAgo(3) },
    { key: 'M_SA4_1', conn: 'SA4', sender: alexId, content: 'Can we start with variables and loops?', createdAt: daysAgo(1) },
    { key: 'M_SA4_2', conn: 'SA4', sender: simonId, content: 'Definitely! I will send you a CodePen link.', createdAt: daysAgo(1) },
    { key: 'M_SJ1_1', conn: 'SJ1', sender: jordanId, content: 'Hi Simon! I want to photograph my dishes for Instagram.', createdAt: daysAgo(9) },
    { key: 'M_SJ1_2', conn: 'SJ1', sender: simonId, content: 'Great goal! We will focus on natural light and angles.', createdAt: daysAgo(9) },
    { key: 'M_SJ2_1', conn: 'SJ2', sender: simonId, content: 'Jordan, your hummus recipe was incredible!', createdAt: daysAgo(2) },
    { key: 'M_SJ2_2', conn: 'SJ2', sender: jordanId, content: 'Thanks! I will share the recipe card with you.', createdAt: daysAgo(2) },
    { key: 'M_AJ1_1', conn: 'AJ1', sender: jordanId, content: 'Alex, the guitar session was so fun!', createdAt: daysAgo(3) },
    { key: 'M_AJ1_2', conn: 'AJ1', sender: alexId, content: 'Glad you enjoyed it! Practice those three chords daily.', createdAt: daysAgo(3) },
    { key: 'M_AJ2_1', conn: 'AJ2', sender: alexId, content: 'That meditation session really helped me focus.', createdAt: daysAgo(1) },
    { key: 'M_AJ2_2', conn: 'AJ2', sender: jordanId, content: 'Happy to hear! Try the 5-minute breathing exercise before work.', createdAt: daysAgo(1) },
    { key: 'M_AJ3_1', conn: 'AJ3', sender: jordanId, content: 'Hola Alex! I want to learn Spanish for my trip.', createdAt: daysAgo(0) },
  ];
  for (const input of msgInputs) {
    M[input.key] = OID();
    await Message.create({
      _id: M[input.key], connectionId: C[input.conn], senderId: input.sender, content: input.content,
      type: 'text', readAt: input.readAt, deliveredAt: input.deliveredAt, isReported: false, reactions: [], isDeleted: false,
      createdAt: input.createdAt,
    });
  }
  console.log(`  ${msgInputs.length} messages`);

  // ─── REVIEWS ─────────────────────────────────────────────────────────
  console.log('\n== Seeding reviews ==');
  const R: Record<string, Types.ObjectId> = {};
  const reviewInputs: any[] = [
    { key: 'R_SA1', conn: 'SA1', reviewer: alexId, reviewee: simonId, skill: 'SIMON_PHOTO', rating: 5, content: 'Simon is an incredible photography teacher. He explained composition and lighting so clearly.', tags: ['Patient teacher', 'Clear explanations', 'Enthusiastic'], wouldRecommend: true },
    { key: 'R_SA2', conn: 'SA2', reviewer: simonId, reviewee: alexId, skill: 'ALEX_SPANISH', rating: 5, content: 'Alex makes Spanish feel easy and fun. I left confident enough to hold a conversation.', tags: ['Engaging', 'Enthusiastic'], wouldRecommend: true },
    { key: 'R_SJ1', conn: 'SJ1', reviewer: jordanId, reviewee: simonId, skill: 'SIMON_PHOTO', rating: 5, content: 'Simon taught me exactly how to photograph food beautifully. My Instagram looks amazing now!', tags: ['Well-prepared', 'Patient teacher'], wouldRecommend: true },
    { key: 'R_SJ2', conn: 'SJ2', reviewer: simonId, reviewee: jordanId, skill: 'JORDAN_COOK', rating: 5, content: 'Jordan is a wonderful cooking teacher. The hummus recipe was a hit with my family.', tags: ['Great listener', 'Practical tips', 'Enthusiastic'], wouldRecommend: true },
    { key: 'R_AJ1', conn: 'AJ1', reviewer: jordanId, reviewee: alexId, skill: 'ALEX_GUITAR', rating: 4, content: 'Alex is patient and encouraging. I can play three chords now!', tags: ['Patient teacher', 'Clear explanations'], wouldRecommend: true },
    { key: 'R_AJ2', conn: 'AJ2', reviewer: alexId, reviewee: jordanId, skill: 'JORDAN_MEDITATE', rating: 5, content: 'The meditation session was exactly what I needed. Jordan is very calming and knowledgeable.', tags: ['Well-prepared', 'Engaging'], wouldRecommend: true },
  ];
  for (const input of reviewInputs) {
    R[input.key] = OID();
    await Review.create({
      _id: R[input.key], connectionId: C[input.conn], reviewerId: input.reviewer, revieweeId: input.reviewee,
      skillId: S[input.skill], rating: input.rating, content: input.content, tags: input.tags, wouldRecommend: input.wouldRecommend,
    });
  }
  console.log(`  ${reviewInputs.length} reviews`);

  // ─── FRIENDSHIPS ─────────────────────────────────────────────────────
  console.log('\n== Seeding friendships ==');
  const F: Record<string, Types.ObjectId> = {};
  const friendshipInputs: any[] = [
    { key: 'F_SA', requester: simonId, addressee: alexId, status: 'accepted', reqTier: 'close_friend', addrTier: 'close_friend', metVia: 'skill_session', sharedSkill: 'SIMON_PHOTO', acceptedAt: daysAgo(30) },
    { key: 'F_SJ', requester: simonId, addressee: jordanId, status: 'accepted', reqTier: 'friend', addrTier: 'friend', metVia: 'skill_session', sharedSkill: 'SIMON_PHOTO', acceptedAt: daysAgo(10) },
    { key: 'F_AJ', requester: alexId, addressee: jordanId, status: 'accepted', reqTier: 'friend', addrTier: 'friend', metVia: 'skill_session', sharedSkill: 'ALEX_GUITAR', acceptedAt: daysAgo(8) },
  ];
  for (const input of friendshipInputs) {
    F[input.key] = OID();
    await Friendship.create({
      _id: F[input.key], requesterId: input.requester, addresseeId: input.addressee, status: input.status,
      requesterTier: input.reqTier, addresseeTier: input.addrTier,
      showStreakTo: { requester: true, addressee: true },
      metVia: input.metVia, sharedSkillId: S[input.sharedSkill],
      directMessageRoomId: getDirectMessageRoomId(String(input.requester), String(input.addressee)),
      acceptedAt: input.acceptedAt,
    });
  }
  console.log(`  ${friendshipInputs.length} friendships`);

  // ─── NOTIFICATIONS ───────────────────────────────────────────────────
  console.log('\n== Seeding notifications ==');
  const notifInputs: any[] = [
    { user: simonId, type: 'request_received', refModel: 'Connection', ref: 'SA4', message: 'Alex T. wants to learn JavaScript from you.', isRead: false },
    { user: simonId, type: 'request_accepted', refModel: 'Connection', ref: 'SA3', message: 'Alex T. accepted your request to learn Guitar.', isRead: false },
    { user: simonId, type: 'review_received', refModel: 'Review', ref: 'R_SA1', message: 'Alex T. reviewed you 5 stars after your photography session.', isRead: false },
    { user: simonId, type: 'new_message', refModel: 'Message', ref: 'M_SA4_2', message: 'New message from Alex T.', isRead: false },
    { user: simonId, type: 'request_received', refModel: 'Connection', ref: 'SJ1', message: 'Jordan M. wants to learn Photography from you.', isRead: true },
    { user: simonId, type: 'review_received', refModel: 'Review', ref: 'R_SJ1', message: 'Jordan M. reviewed you 5 stars.', isRead: false },
    { user: simonId, type: 'friend_request_accepted', refModel: 'Friendship', ref: 'F_SJ', message: 'Jordan M. accepted your friend request.', isRead: true },
    { user: alexId, type: 'request_received', refModel: 'Connection', ref: 'SA2', message: 'Simon K. wants to learn Spanish from you.', isRead: true },
    { user: alexId, type: 'request_accepted', refModel: 'Connection', ref: 'SA4', message: 'Simon K. accepted your request to learn JavaScript.', isRead: true },
    { user: alexId, type: 'review_received', refModel: 'Review', ref: 'R_SA2', message: 'Simon K. reviewed you 5 stars after your Spanish session.', isRead: false },
    { user: alexId, type: 'request_received', refModel: 'Connection', ref: 'AJ2', message: 'Jordan M. wants to learn Meditation from you.', isRead: true },
    { user: alexId, type: 'review_received', refModel: 'Review', ref: 'R_AJ2', message: 'Jordan M. reviewed you 5 stars.', isRead: false },
    { user: alexId, type: 'new_message', refModel: 'Message', ref: 'M_AJ3_1', message: 'New message from Jordan M.', isRead: false },
    { user: jordanId, type: 'request_received', refModel: 'Connection', ref: 'SJ2', message: 'Simon K. wants to learn Healthy Cooking from you.', isRead: true },
    { user: jordanId, type: 'request_accepted', refModel: 'Connection', ref: 'AJ1', message: 'Alex T. accepted your request to learn Guitar.', isRead: true },
    { user: jordanId, type: 'review_received', refModel: 'Review', ref: 'R_SJ2', message: 'Simon K. reviewed you 5 stars.', isRead: false },
    { user: jordanId, type: 'review_received', refModel: 'Review', ref: 'R_AJ1', message: 'Alex T. reviewed you 4 stars.', isRead: false },
    { user: jordanId, type: 'new_message', refModel: 'Message', ref: 'M_AJ2_2', message: 'New message from Alex T.', isRead: false },
    { user: jordanId, type: 'friend_request', refModel: 'Friendship', ref: 'F_SJ', message: 'Simon K. sent you a friend request.', isRead: true },
  ];
  for (const input of notifInputs) {
    const refObj = C[input.ref] ?? R[input.ref] ?? M[input.ref] ?? F[input.ref];
    await Notification.create({
      userId: input.user, type: input.type, referenceId: refObj, referenceModel: input.refModel,
      message: input.message, isRead: input.isRead,
    });
  }
  console.log(`  ${notifInputs.length} notifications`);

  // ─── SKILL SWAPS ─────────────────────────────────────────────────────
  console.log('\n== Seeding skill swaps ==');
  const SW: Record<string, Types.ObjectId> = {};
  const swapInputs: any[] = [
    { key: 'SW_SA1', a: simonId, b: alexId, aSkill: 'SIMON_JS', bSkill: 'ALEX_SPANISH', status: 'accepted' },
    { key: 'SW_SA2', a: simonId, b: alexId, aSkill: 'SIMON_PHOTO', bSkill: 'ALEX_GUITAR', status: 'suggested' },
    { key: 'SW_SJ', a: simonId, b: jordanId, aSkill: 'SIMON_PHOTO', bSkill: 'JORDAN_COOK', status: 'accepted' },
    { key: 'SW_AJ', a: alexId, b: jordanId, aSkill: 'ALEX_GUITAR', bSkill: 'JORDAN_MEDITATE', status: 'accepted' },
  ];
  for (const input of swapInputs) {
    SW[input.key] = OID();
    const { a, b } = canonicalPair(String(input.a), input.a.equals(simonId) ? String(input.b) : String(input.b));
    const aIsA = a === String(input.a);
    await SkillSwap.create({
      _id: SW[input.key], userAId: new Types.ObjectId(a), userBId: new Types.ObjectId(b),
      userATeachesSkillId: aIsA ? S[input.aSkill] : S[input.bSkill],
      userBTeachesSkillId: aIsA ? S[input.bSkill] : S[input.aSkill],
      status: input.status,
    });
  }
  console.log(`  ${swapInputs.length} skill swaps`);

  // ─── GROUP SESSIONS ──────────────────────────────────────────────────
  console.log('\n== Seeding group sessions ==');
  const GS: Record<string, Types.ObjectId> = {};
  const gsInputs: any[] = [
    { key: 'GS1', teacher: simonId, skill: 'SIMON_PHOTO', title: 'Street Photography Walk', desc: 'A guided walk through Gulshan.', max: 8, participants: [alexId, jordanId], format: 'in-person', status: 'open', type: 'workshop', scheduledAt: daysFromNow(3), chat: 'gs-simon-1' },
    { key: 'GS2', teacher: simonId, skill: 'SIMON_JS', title: 'JavaScript Study Group', desc: 'Weekly online study session.', max: 6, participants: [alexId], format: 'online', status: 'open', type: 'regular', scheduledAt: daysFromNow(5), chat: 'gs-simon-2' },
    { key: 'GS3', teacher: alexId, skill: 'ALEX_SPANISH', title: 'Spanish Conversation Circle', desc: 'Practice speaking in a relaxed setting.', max: 6, participants: [simonId, jordanId], format: 'in-person', status: 'full', type: 'regular', scheduledAt: daysFromNow(2), chat: 'gs-alex-1' },
    { key: 'GS4', teacher: jordanId, skill: 'JORDAN_MEDITATE', title: 'Morning Meditation', desc: 'Start your day with 20 minutes of guided meditation.', max: 10, participants: [simonId, alexId], format: 'online', status: 'open', type: 'workshop', scheduledAt: daysFromNow(1), chat: 'gs-jordan-1' },
    { key: 'GS5', teacher: jordanId, skill: 'JORDAN_COOK', title: 'Meal Prep Sunday', desc: 'Cook healthy meals for the week together.', max: 5, participants: [simonId], format: 'in-person', status: 'open', type: 'workshop', scheduledAt: daysFromNow(7), chat: 'gs-jordan-2' },
    { key: 'GS6', teacher: simonId, skill: 'SIMON_PHOTO', title: 'Portrait Lighting Workshop', desc: 'Past completed session.', max: 6, participants: [alexId, jordanId], format: 'in-person', status: 'completed', type: 'workshop', scheduledAt: daysAgo(10), chat: 'gs-simon-3' },
  ];
  for (const input of gsInputs) {
    GS[input.key] = OID();
    await GroupSession.create({
      _id: GS[input.key], teacherId: input.teacher, skillId: S[input.skill], title: input.title,
      description: input.desc, maxParticipants: input.max, participants: input.participants,
      format: input.format, scheduledAt: input.scheduledAt, status: input.status, sessionType: input.type,
      chatRoomId: input.chat,
    });
  }
  console.log(`  ${gsInputs.length} group sessions`);

  // ─── SAVED SEARCHES ──────────────────────────────────────────────────
  console.log('\n== Seeding saved searches ==');
  await SavedSearch.create([
    { userId: simonId, name: 'Spanish teachers nearby', filters: { category: 'Languages & Communication', type: 'teach', radius: 10 }, alertEnabled: true, lastAlertSentAt: daysAgo(1) },
    { userId: simonId, name: 'Online guitar', filters: { category: 'Music & Arts', format: 'online' }, alertEnabled: false },
    { userId: alexId, name: 'Photography workshops', filters: { category: 'Photography & Visual', type: 'teach', radius: 15 }, alertEnabled: true, lastAlertSentAt: daysAgo(2) },
    { userId: alexId, name: 'Cooking beginners', filters: { category: 'Food & Cooking', proficiencyLevel: 'beginner' }, alertEnabled: true },
    { userId: jordanId, name: 'Music teachers', filters: { category: 'Music & Arts', type: 'teach' }, alertEnabled: true, lastAlertSentAt: daysAgo(3) },
    { userId: jordanId, name: 'Online meditation', filters: { category: 'Wellness & Fitness', format: 'online' }, alertEnabled: false },
  ]);
  console.log('  6 saved searches');

  // ─── COMMUNITY POSTS ─────────────────────────────────────────────────
  console.log('\n== Seeding community posts ==');
  const P: Record<string, Types.ObjectId> = {};
  const postInputs: any[] = [
    { key: 'P1', author: simonId, content: 'Just captured an amazing golden hour shot on Gulshan Avenue! Anyone else love street photography?', votes: [{ userId: alexId, vote: 'up' }, { userId: jordanId, vote: 'up' }], score: 2 },
    { key: 'P2', author: simonId, content: 'Looking for a Spanish conversation partner on weekends.', votes: [{ userId: alexId, vote: 'up' }], score: 1 },
    { key: 'P3', author: alexId, content: 'My first guitar chord progression! D - A - Em. Thanks Simon!', votes: [{ userId: simonId, vote: 'up' }, { userId: jordanId, vote: 'up' }], score: 2 },
    { key: 'P4', author: alexId, content: 'Any healthy meal-prep tips? I am trying to eat better.', votes: [{ userId: jordanId, vote: 'up' }], score: 1 },
    { key: 'P5', author: jordanId, content: 'Free guided meditation session this Sunday morning at 8 AM. DM me for the Zoom link!', votes: [{ userId: simonId, vote: 'up' }, { userId: alexId, vote: 'up' }], score: 2 },
    { key: 'P6', author: jordanId, content: 'Just discovered falafel wraps are the ultimate meal prep food. Game changer!', votes: [{ userId: simonId, vote: 'up' }], score: 1 },
  ];
  for (const input of postInputs) {
    P[input.key] = OID();
    await CommunityPost.create({
      _id: P[input.key], authorId: input.author, content: input.content, city: 'dhaka', neighborhood: 'Gulshan',
      voteScore: input.score, userVotes: input.votes, isDeleted: false, isFlagged: false,
    });
  }
  console.log(`  ${postInputs.length} community posts`);

  // ─── ENDORSEMENTS ────────────────────────────────────────────────────
  console.log('\n== Seeding endorsements ==');
  await Endorsement.create([
    { endorserId: alexId, endorseeId: simonId, skillId: S.SIMON_PHOTO, connectionId: C.SA1 },
    { endorserId: jordanId, endorseeId: simonId, skillId: S.SIMON_PHOTO, connectionId: C.SJ1 },
    { endorserId: simonId, endorseeId: alexId, skillId: S.ALEX_SPANISH, connectionId: C.SA2 },
    { endorserId: jordanId, endorseeId: alexId, skillId: S.ALEX_GUITAR, connectionId: C.AJ1 },
    { endorserId: simonId, endorseeId: jordanId, skillId: S.JORDAN_COOK, connectionId: C.SJ2 },
    { endorserId: alexId, endorseeId: jordanId, skillId: S.JORDAN_MEDITATE, connectionId: C.AJ2 },
  ]);
  console.log('  6 endorsements');

  // ─── COURSES ─────────────────────────────────────────────────────────
  console.log('\n== Seeding courses ==');
  const CR: Record<string, Types.ObjectId> = {};
  const courseInputs: any[] = [
    { key: 'CR1', teacher: simonId, skill: 'SIMON_PHOTO', title: 'Photography Fundamentals', desc: 'A complete beginner photography course.', sessions: [
      { title: 'Camera Basics', description: 'Understanding your camera.', objectives: ['Identify camera parts', 'Set exposure modes'], order: 0, estimatedMinutes: 60 },
      { title: 'Composition', description: 'Rule of thirds, leading lines.', objectives: ['Apply rule of thirds'], order: 1, estimatedMinutes: 60 },
      { title: 'Natural Light', description: 'Working with available light.', objectives: ['Use golden hour'], order: 2, estimatedMinutes: 60 },
      { title: 'Editing Basics', description: 'Lightroom intro.', objectives: ['Edit a photo'], order: 3, estimatedMinutes: 60 },
    ], max: 20, count: 2, status: 'published', total: 240 },
    { key: 'CR2', teacher: simonId, skill: 'SIMON_JS', title: 'JavaScript for Beginners', desc: 'Draft course on JS.', sessions: [
      { title: 'Variables', objectives: ['Declare variables'], order: 0, estimatedMinutes: 45 },
      { title: 'Functions', objectives: ['Write functions'], order: 1, estimatedMinutes: 45 },
      { title: 'DOM', objectives: ['Manipulate DOM'], order: 2, estimatedMinutes: 45 },
    ], max: 10, count: 0, status: 'draft', total: 135 },
    { key: 'CR3', teacher: alexId, skill: 'ALEX_SPANISH', title: 'Conversational Spanish', desc: 'Learn to speak Spanish confidently.', sessions: [
      { title: 'Greetings', objectives: ['Greet people'], order: 0, estimatedMinutes: 45 },
      { title: 'At the Cafe', objectives: ['Order food'], order: 1, estimatedMinutes: 45 },
      { title: 'Getting Around', objectives: ['Ask for directions'], order: 2, estimatedMinutes: 45 },
      { title: 'Shopping', objectives: ['Bargain and buy'], order: 3, estimatedMinutes: 45 },
      { title: 'Wrap-up', objectives: ['Hold a conversation'], order: 4, estimatedMinutes: 45 },
    ], max: 15, count: 1, status: 'published', total: 225 },
    { key: 'CR4', teacher: jordanId, skill: 'JORDAN_MEDITATE', title: 'Mindfulness for Beginners', desc: 'A 4-session introduction to meditation.', sessions: [
      { title: 'Breathing', objectives: ['Deep breathing'], order: 0, estimatedMinutes: 30 },
      { title: 'Body Scan', objectives: ['Relax each body part'], order: 1, estimatedMinutes: 30 },
      { title: 'Walking Meditation', objectives: ['Mindful walking'], order: 2, estimatedMinutes: 30 },
      { title: 'Loving-Kindness', objectives: ['Practice compassion'], order: 3, estimatedMinutes: 30 },
    ], max: 12, count: 2, status: 'published', total: 120 },
  ];
  for (const input of courseInputs) {
    CR[input.key] = OID();
    await Course.create({
      _id: CR[input.key], teacherId: input.teacher, skillId: S[input.skill], title: input.title,
      description: input.desc, sessions: input.sessions, maxEnrollments: input.max,
      enrollmentCount: input.count, status: input.status, totalEstimatedMinutes: input.total,
    });
  }
  console.log(`  ${courseInputs.length} courses`);

  // ─── COURSE ENROLLMENTS ──────────────────────────────────────────────
  console.log('\n== Seeding course enrollments ==');
  const CE: Record<string, Types.ObjectId> = {};
  const ceInputs: any[] = [
    { key: 'CE1', course: 'CR1', learner: alexId, status: 'in_progress', progress: [{ sessionIndex: 0, completed: true, completedAt: daysAgo(3) }, { sessionIndex: 1, completed: true, completedAt: daysAgo(1) }], startedAt: daysAgo(10) },
    { key: 'CE2', course: 'CR1', learner: jordanId, status: 'enrolled', progress: [], startedAt: daysAgo(1) },
    { key: 'CE3', course: 'CR3', learner: simonId, status: 'in_progress', progress: [{ sessionIndex: 0, completed: true, completedAt: daysAgo(5) }, { sessionIndex: 1, completed: false }], startedAt: daysAgo(12) },
    { key: 'CE4', course: 'CR3', learner: jordanId, status: 'completed', progress: [{ sessionIndex: 0, completed: true }, { sessionIndex: 1, completed: true }, { sessionIndex: 2, completed: true }, { sessionIndex: 3, completed: true }, { sessionIndex: 4, completed: true }], startedAt: daysAgo(30), completedAt: daysAgo(2), certificateId: 'cert_jordan_spanish' },
    { key: 'CE5', course: 'CR4', learner: simonId, status: 'in_progress', progress: [{ sessionIndex: 0, completed: true, completedAt: daysAgo(2) }, { sessionIndex: 1, completed: false }], startedAt: daysAgo(5) },
    { key: 'CE6', course: 'CR4', learner: alexId, status: 'enrolled', progress: [], startedAt: daysAgo(1) },
  ];
  for (const input of ceInputs) {
    CE[input.key] = OID();
    await CourseEnrollment.create({
      _id: CE[input.key], courseId: CR[input.course], learnerId: input.learner, status: input.status,
      progress: input.progress, startedAt: input.startedAt, completedAt: input.completedAt, certificateId: input.certificateId,
    });
  }
  console.log(`  ${ceInputs.length} enrollments`);

  // ─── CHALLENGES ──────────────────────────────────────────────────────
  console.log('\n== Seeding challenges ==');
  const CH: Record<string, Types.ObjectId> = {};
  const chInputs: any[] = [
    { key: 'CH1', creator: simonId, title: 'Photo a Day', desc: 'Take one creative photo every day for a month.', cat: 'Photography & Visual Arts', type: 'both', goal: 'Take 30 creative photos', target: 30, start: daysAgo(3), end: daysFromNow(27), status: 'active', participants: [{ userId: simonId, joinedAt: daysAgo(3), progress: 8 }, { userId: alexId, joinedAt: daysAgo(2), progress: 5 }, { userId: jordanId, joinedAt: daysAgo(1), progress: 3 }], badge: 'Shutterbug', icon: '📸', max: 50 },
    { key: 'CH2', creator: alexId, title: 'Spanish Sprint', desc: 'Learn 50 new Spanish words in a week.', cat: 'Languages & Communication', type: 'teach', goal: 'Teach 50 vocabulary words', target: 50, start: daysFromNow(2), end: daysFromNow(9), status: 'upcoming', participants: [], badge: 'Polyglot', icon: '🗣️' },
    { key: 'CH3', creator: jordanId, title: 'Mindful March', desc: 'Meditate every day for 30 days.', cat: 'Music & Performing Arts', type: 'both', goal: '30 days of meditation', target: 30, start: daysAgo(30), end: daysAgo(1), status: 'completed', participants: [{ userId: jordanId, joinedAt: daysAgo(30), progress: 30, completedAt: daysAgo(1) }, { userId: simonId, joinedAt: daysAgo(28), progress: 22, completedAt: daysAgo(3) }], badge: 'Zen Master', icon: '🧘' },
  ];
  for (const input of chInputs) {
    CH[input.key] = OID();
    await Challenge.create({
      _id: CH[input.key], creatorId: input.creator, title: input.title, description: input.desc,
      skillCategory: input.cat, challengeType: input.type, goalDescription: input.goal, goalTarget: input.target,
      startDate: input.start, endDate: input.end, status: input.status, participants: input.participants,
      badgeName: input.badge, badgeIcon: input.icon, maxParticipants: input.max,
    });
  }
  console.log(`  ${chInputs.length} challenges`);

  // ─── MENTORSHIPS ─────────────────────────────────────────────────────
  console.log('\n== Seeding mentorships ==');
  const MS: Record<string, Types.ObjectId> = {};
  const msInputs: any[] = [
    { key: 'MS1', mentor: simonId, mentee: jordanId, skill: 'SIMON_PHOTO', status: 'active', goals: [{ title: 'Master portrait photography', description: 'Learn lighting and posing', targetDate: daysFromNow(30), completed: false }, { title: 'Shoot a portfolio', description: '10 portfolio images', completed: false }], checkIns: [{ date: daysAgo(2), notes: 'Practised golden hour shooting.', mentorNotes: 'Great improvement!' }], startDate: daysAgo(10), durationMonths: 2, meeting: 'weekly' },
    { key: 'MS2', mentor: alexId, mentee: simonId, skill: 'ALEX_SPANISH', status: 'active', goals: [{ title: 'Hold a 5-minute conversation', completed: false }], checkIns: [{ date: daysAgo(4), notes: 'Practised ordering at a cafe.', mentorNotes: 'Good pronunciation.' }], startDate: daysAgo(14), durationMonths: 2, meeting: 'weekly' },
    { key: 'MS3', mentor: jordanId, mentee: alexId, skill: 'JORDAN_MEDITATE', status: 'completed', goals: [{ title: 'Establish daily practice', completed: true, completedAt: daysAgo(1) }], checkIns: [{ date: daysAgo(5), notes: 'Completed 10-day streak.', mentorNotes: 'Well done!' }], startDate: daysAgo(30), completedAt: daysAgo(1), durationMonths: 1, meeting: 'weekly' },
    { key: 'MS4', mentor: simonId, mentee: alexId, skill: 'SIMON_JS', status: 'pending', goals: [{ title: 'Learn DOM manipulation', completed: false }], checkIns: [], startDate: daysAgo(1), durationMonths: 2, meeting: 'weekly' },
  ];
  for (const input of msInputs) {
    MS[input.key] = OID();
    await Mentorship.create({
      _id: MS[input.key], mentorId: input.mentor, menteeId: input.mentee, skillId: S[input.skill],
      status: input.status, goals: input.goals, checkIns: input.checkIns, startDate: input.startDate,
      completedAt: input.completedAt, durationMonths: input.durationMonths, meetingFrequency: input.meeting,
    });
  }
  console.log(`  ${msInputs.length} mentorships`);

  // ─── SHOWCASES ───────────────────────────────────────────────────────
  console.log('\n== Seeding showcases ==');
  await Showcase.create([
    { userId: simonId, skillId: S.SIMON_PHOTO, title: 'Golden Hour in Gulshan', description: 'My best street shot this month.', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/simon_golden.jpg', publicId: 'show/simon_golden', caption: 'Golden hour magic' }], likes: [{ userId: alexId, createdAt: daysAgo(1) }, { userId: jordanId, createdAt: daysAgo(1) }], likeCount: 2, commentCount: 1 },
    { userId: simonId, skillId: S.SIMON_JS, title: 'My First Todo App', description: 'Built a todo app with vanilla JS.', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/simon_todo.jpg', publicId: 'show/simon_todo' }], likes: [{ userId: alexId, createdAt: daysAgo(2) }], likeCount: 1, commentCount: 0 },
    { userId: alexId, skillId: S.ALEX_SPANISH, title: 'First Spanish Conversation', description: 'Held a 3-minute conversation with Simon!', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/alex_spanish.jpg', publicId: 'show/alex_spanish' }], likes: [{ userId: simonId, createdAt: daysAgo(3) }, { userId: jordanId, createdAt: daysAgo(3) }], likeCount: 2, commentCount: 1 },
    { userId: alexId, skillId: S.ALEX_GUITAR, title: 'First Song!', description: 'Played my first complete song on guitar.', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/alex_guitar.jpg', publicId: 'show/alex_guitar' }], likes: [{ userId: simonId, createdAt: daysAgo(1) }], likeCount: 1, commentCount: 0 },
    { userId: jordanId, skillId: S.JORDAN_COOK, title: 'Meal Prep Masterpiece', description: 'Prepped 5 healthy lunches in one hour.', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/jordan_mealprep.jpg', publicId: 'show/jordan_mealprep', caption: 'Meal prep done right' }], likes: [{ userId: simonId, createdAt: daysAgo(2) }, { userId: alexId, createdAt: daysAgo(2) }], likeCount: 2, commentCount: 2 },
    { userId: jordanId, skillId: S.JORDAN_MEDITATE, title: '30-Day Streak!', description: 'Completed the Mindful March challenge.', media: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/show/jordan_streak.jpg', publicId: 'show/jordan_streak' }], likes: [{ userId: simonId, createdAt: daysAgo(1) }], likeCount: 1, commentCount: 0 },
  ]);
  console.log('  6 showcases');

  // ─── WEBHOOKS ────────────────────────────────────────────────────────
  console.log('\n== Seeding webhooks ==');
  const WH: Record<string, Types.ObjectId> = {};
  await Webhook.create([
    { _id: (WH.WH1 = OID()), ownerId: simonId, url: 'https://example.com/simon-hook', events: ['session.completed', 'member.joined'], secret: 'whsec_simon_1', status: 'active', failCount: 0, lastTriggeredAt: daysAgo(1), lastSuccessAt: daysAgo(1), logs: [{ event: 'session.completed', payload: { ok: true }, statusCode: 200, success: true, attemptedAt: daysAgo(1) }] },
    { _id: (WH.WH2 = OID()), ownerId: alexId, url: 'https://example.com/alex-hook', events: ['review.created'], secret: 'whsec_alex_1', status: 'active', failCount: 0, lastTriggeredAt: daysAgo(2), lastSuccessAt: daysAgo(2), logs: [{ event: 'review.created', payload: { ok: true }, statusCode: 200, success: true, attemptedAt: daysAgo(2) }] },
    { _id: (WH.WH3 = OID()), ownerId: jordanId, url: 'https://example.com/jordan-hook', events: ['connection.completed'], secret: 'whsec_jordan_1', status: 'disabled', failCount: 2, lastTriggeredAt: daysAgo(5), logs: [{ event: 'connection.completed', payload: {}, statusCode: 500, success: false, error: 'Timeout', attemptedAt: daysAgo(5) }] },
  ]);
  console.log('  3 webhooks');

  // ─── API KEYS ────────────────────────────────────────────────────────
  console.log('\n== Seeding API keys ==');
  await ApiKey.create([
    { ownerId: simonId, key: 'sk_test_simon_active', name: 'Simon Active Key', scopes: ['skills:read', 'stats:read'], status: 'active', rateLimit: 100, requestCount: 55, lastUsedAt: daysAgo(0), expiresAt: daysFromNow(60) },
    { ownerId: simonId, key: 'sk_test_simon_revoked', name: 'Simon Old Key', scopes: ['skills:read'], status: 'revoked', rateLimit: 100, requestCount: 12, lastUsedAt: daysAgo(15) },
    { ownerId: alexId, key: 'sk_test_alex_active', name: 'Alex Active Key', scopes: ['users:read', 'skills:read'], status: 'active', rateLimit: 100, requestCount: 30, lastUsedAt: daysAgo(1), expiresAt: daysFromNow(45) },
    { ownerId: jordanId, key: 'sk_test_jordan_active', name: 'Jordan Active Key', scopes: ['skills:read'], status: 'active', rateLimit: 50, requestCount: 8, lastUsedAt: daysAgo(3), expiresAt: daysFromNow(30) },
  ]);
  console.log('  4 API keys');

  // ─── CALENDAR INTEGRATIONS ───────────────────────────────────────────
  console.log('\n== Seeding calendar integrations ==');
  await CalendarIntegration.create([
    { userId: simonId, provider: 'google', accessToken: 'at_google_simon', refreshToken: 'rt_google_simon', calendarId: 'primary', calendarName: 'Primary', syncStatus: 'active', lastSyncedAt: daysAgo(0), syncToken: 'sync_simon_1', events: [{ externalId: 'ev_s1', title: 'Photography Walk with Alex', start: daysFromNow(1), end: daysFromNow(1), description: 'Street photography session', location: 'Gulshan', connectionId: C.SA1 }] },
    { userId: alexId, provider: 'google', accessToken: 'at_google_alex', refreshToken: 'rt_google_alex', calendarId: 'primary', calendarName: 'Primary', syncStatus: 'active', lastSyncedAt: daysAgo(1), syncToken: 'sync_alex_1', events: [{ externalId: 'ev_a1', title: 'Spanish Practice with Simon', start: daysFromNow(2), end: daysFromNow(2), description: 'Spanish conversation', location: 'Banani', connectionId: C.SA2 }] },
    { userId: jordanId, provider: 'outlook', accessToken: 'at_outlook_jordan', refreshToken: 'rt_outlook_jordan', calendarId: 'outlook', calendarName: 'Outlook', syncStatus: 'error', lastSyncedAt: daysAgo(7), syncToken: 'sync_jordan_1', events: [] },
  ]);
  console.log('  3 calendar integrations');

  // ─── BOT INSTALLATIONS ───────────────────────────────────────────────
  console.log('\n== Seeding bot installations ==');
  await BotInstallation.create([
    { externalId: 'ext_slack_simon', name: 'Skill Hearth Bot', platform: 'slack', accessToken: 'at_slack_simon', botToken: 'bt_slack_simon', teamId: 'T_SIMON', teamName: 'Simon Workspace', channelId: 'C_SIMON', channelName: 'general', installedBy: simonId, status: 'active', lastUsedAt: daysAgo(1), commandCount: 20 },
    { externalId: 'ext_discord_alex', name: 'Hearth Bot', platform: 'discord', accessToken: 'at_discord_alex', botToken: 'bt_discord_alex', installedBy: alexId, status: 'active', commandCount: 12 },
    { externalId: 'ext_slack_jordan', name: 'Jordan Bot', platform: 'slack', accessToken: 'at_slack_jordan', botToken: 'bt_slack_jordan', installedBy: jordanId, status: 'disabled', commandCount: 5 },
  ]);
  console.log('  3 bot installations');

  // ─── ACTIVITY EVENTS ─────────────────────────────────────────────────
  console.log('\n== Seeding activity events ==');
  const AE: Record<string, Types.ObjectId> = {};
  const aeInputs: any[] = [
    { key: 'AE1', actor: simonId, eventType: 'skill_added', subjectType: 'skill', subject: 'SIMON_PHOTO', title: 'Simon added a skill: Photography', subtitle: 'Photography & Visual Arts', visibility: 'public', ago: 30, expires: 90, reactions: [{ userId: alexId, emoji: '❤️', createdAt: daysAgo(29) }] },
    { key: 'AE2', actor: simonId, eventType: 'badge_earned', subjectType: 'badge', subject: null, title: 'Simon earned: Local Legend', subtitle: '', visibility: 'public', ago: 5, expires: 90, reactions: [{ userId: alexId, emoji: '👏', createdAt: daysAgo(4) }, { userId: jordanId, emoji: '🔥', createdAt: daysAgo(4) }] },
    { key: 'AE3', actor: simonId, eventType: 'session_taught', subjectType: 'connection', subject: 'SA1', title: 'Simon taught a photography session', subtitle: 'Photography & Visual Arts', visibility: 'friends', ago: 14, expires: 90, reactions: [{ userId: alexId, emoji: '🎉', createdAt: daysAgo(13) }] },
    { key: 'AE4', actor: simonId, eventType: 'challenge_completed', subjectType: 'challenge', subject: 'CH3', title: 'Simon completed: Mindful March', subtitle: 'Music & Performing Arts', visibility: 'friends', ago: 3, expires: 90 },
    { key: 'AE5', actor: alexId, eventType: 'skill_added', subjectType: 'skill', subject: 'ALEX_SPANISH', title: 'Alex added a skill: Spanish', subtitle: 'Languages & Communication', visibility: 'public', ago: 25, expires: 90, reactions: [{ userId: simonId, emoji: '❤️', createdAt: daysAgo(24) }] },
    { key: 'AE6', actor: alexId, eventType: 'session_completed', subjectType: 'connection', subject: 'SA2', title: 'Alex completed a Spanish session', subtitle: 'Spanish', visibility: 'friends', ago: 7, expires: 90, reactions: [{ userId: simonId, emoji: '👍', createdAt: daysAgo(6) }] },
    { key: 'AE7', actor: alexId, eventType: 'review_received', subjectType: 'review', subject: 'R_SA2', title: 'Alex received a 5-star review', subtitle: 'Spanish', visibility: 'friends', ago: 6, expires: 90, reactions: [{ userId: simonId, emoji: '⭐', createdAt: daysAgo(5) }] },
    { key: 'AE8', actor: jordanId, eventType: 'skill_added', subjectType: 'skill', subject: 'JORDAN_COOK', title: 'Jordan added a skill: Healthy Cooking', subtitle: 'Food & Cooking', visibility: 'public', ago: 20, expires: 90, reactions: [{ userId: simonId, emoji: '❤️', createdAt: daysAgo(19) }] },
    { key: 'AE9', actor: jordanId, eventType: 'challenge_completed', subjectType: 'challenge', subject: 'CH3', title: 'Jordan completed: Mindful March', subtitle: 'Music & Performing Arts', visibility: 'public', ago: 1, expires: 90, reactions: [{ userId: simonId, emoji: '🎉', createdAt: daysAgo(0) }, { userId: alexId, emoji: '🏆', createdAt: daysAgo(0) }] },
    { key: 'AE10', actor: jordanId, eventType: 'session_taught', subjectType: 'connection', subject: 'SJ2', title: 'Jordan taught a cooking session', subtitle: 'Healthy Cooking', visibility: 'friends', ago: 3, expires: 90, reactions: [{ userId: simonId, emoji: '😋', createdAt: daysAgo(2) }] },
    { key: 'AE11', actor: simonId, eventType: 'friend_joined', subjectType: 'friendship', subject: 'F_SJ', title: 'Simon and Jordan are now friends', subtitle: '', visibility: 'friends', ago: 10, expires: 90 },
    { key: 'AE12', actor: alexId, eventType: 'streak_milestone', subjectType: 'streak', subject: null, title: 'Alex hit a 7-day streak', subtitle: 'Learning', visibility: 'close_friends', ago: 8, expires: 90, reactions: [{ userId: simonId, emoji: '🔥', createdAt: daysAgo(7) }] },
  ];
  for (const input of aeInputs) {
    AE[input.key] = OID();
    let subjectId: Types.ObjectId | undefined;
    if (input.subject) {
      subjectId = C[input.subject] ?? S[input.subject] ?? GS[input.subject] ?? F[input.subject] ?? SW[input.subject] ?? CH[input.subject] ?? R[input.subject] ?? undefined;
    }
    const createdAt = daysAgo(input.ago);
    await ActivityEvent.create({
      _id: AE[input.key], actorId: input.actor, eventType: input.eventType, subjectType: input.subjectType,
      subjectId, preview: { title: input.title, subtitle: input.subtitle }, visibility: input.visibility,
      reactions: input.reactions ?? [], commentCount: 0, expiresAt: new Date(createdAt.getTime() + input.expires * D), createdAt,
    });
  }
  console.log(`  ${aeInputs.length} activity events`);

  // ─── STREAKS ─────────────────────────────────────────────────────────
  console.log('\n== Seeding streaks ==');
  await Streak.create([
    { userId: simonId, type: 'teaching', currentStreak: 10, longestStreak: 15, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(10), freezesUsed: 1, freezesAvailable: 2, milestones: [7] },
    { userId: simonId, type: 'learning', currentStreak: 18, longestStreak: 22, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(18), freezesUsed: 0, freezesAvailable: 2, milestones: [7, 14] },
    { userId: simonId, type: 'logging', currentStreak: 6, longestStreak: 10, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(6), freezesUsed: 1, freezesAvailable: 2, milestones: [] },
    { userId: alexId, type: 'teaching', currentStreak: 8, longestStreak: 12, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(8), freezesUsed: 0, freezesAvailable: 2, milestones: [7] },
    { userId: alexId, type: 'learning', currentStreak: 5, longestStreak: 9, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(5), freezesUsed: 0, freezesAvailable: 2, milestones: [] },
    { userId: jordanId, type: 'teaching', currentStreak: 4, longestStreak: 7, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(4), freezesUsed: 0, freezesAvailable: 2, milestones: [] },
    { userId: jordanId, type: 'learning', currentStreak: 3, longestStreak: 5, lastActivityDate: daysAgo(0), streakStartDate: daysAgo(3), freezesUsed: 0, freezesAvailable: 2, milestones: [] },
  ]);
  console.log('  7 streaks');

  // ─── DIRECT MESSAGES ─────────────────────────────────────────────────
  console.log('\n== Seeding direct messages ==');
  await DirectMessage.create([
    { senderId: simonId, recipientId: alexId, content: 'Hey! Ready for our guitar session tomorrow?', readAt: daysAgo(1) },
    { senderId: alexId, recipientId: simonId, content: 'Yes! Bring your capo.', readAt: daysAgo(1) },
    { senderId: simonId, recipientId: alexId, content: 'See you at 6 PM.', readAt: undefined },
    { senderId: alexId, recipientId: jordanId, content: 'Thanks for the meditation tips today!', readAt: daysAgo(1) },
    { senderId: jordanId, recipientId: alexId, content: 'Anytime! Let me know how the breathing exercises go.', readAt: daysAgo(1) },
    { senderId: simonId, recipientId: jordanId, content: 'Your hummus recipe was amazing.', readAt: daysAgo(0) },
    { senderId: jordanId, recipientId: simonId, content: 'I will send you the full recipe card tonight!', readAt: undefined },
  ]);
  console.log('  7 direct messages');

  // ─── SKILL JOURNALS ──────────────────────────────────────────────────
  console.log('\n== Seeding skill journals ==');
  await SkillJournal.create([
    { userId: simonId, connectionId: C.SA1, prompt: 'What did you learn today?', content: 'Alex picked up composition rules really quickly. The golden hour light was perfect for our walk.', mood: 5, isHighlighted: true },
    { userId: simonId, connectionId: C.SJ2, prompt: 'What went well?', content: 'Jordan showed me how to make the perfect hummus. The trick is the tahini ratio!', mood: 4, isHighlighted: false },
    { userId: alexId, connectionId: C.SA2, prompt: 'How did the session go?', content: 'Simon ordered coffee entirely in Spanish! We celebrated with churros.', mood: 5, isHighlighted: true },
    { userId: alexId, connectionId: C.AJ2, prompt: 'Biggest takeaway?', content: 'The 4-7-8 breathing technique really works for focus before coding.', mood: 4, isHighlighted: false },
    { userId: jordanId, connectionId: C.SJ1, prompt: 'What was the best part?', content: 'Simon showed me how to use natural light for food photography. Game changer for my Instagram!', mood: 5, isHighlighted: true },
    { userId: jordanId, connectionId: C.AJ1, prompt: 'How did it feel?', content: 'I can play three chords now. Simple but feels amazing.', mood: 4, isHighlighted: false },
  ]);
  console.log('  6 skill journals');

  // ─── LEARNER REQUESTS ────────────────────────────────────────────────
  console.log('\n== Seeding learner requests ==');
  await LearnerRequest.create([
    { authorId: simonId, skillName: 'Guitar', categoryName: 'Music & Performing Arts', description: 'Want to play acoustic guitar songs by the campfire.', city: 'dhaka', neighborhood: 'Gulshan', format: 'in-person', availability: ['Weekends'], status: 'open', responsesCount: 1 },
    { authorId: alexId, skillName: 'Healthy Cooking', categoryName: 'Food & Cooking', description: 'Trying to meal-prep healthier lunches for work.', city: 'dhaka', neighborhood: 'Banani', format: 'either', availability: ['Evenings'], status: 'open', responsesCount: 1 },
    { authorId: jordanId, skillName: 'Photography', categoryName: 'Photography & Visual Arts', description: 'Want to take better food and nature photos for social media.', city: 'dhaka', neighborhood: 'Dhanmondi', format: 'in-person', availability: ['Weekends'], status: 'filled', responsesCount: 2 },
  ]);
  console.log('  3 learner requests');

  // ─── SESSION NOTES ───────────────────────────────────────────────────
  console.log('\n== Seeding session notes ==');
  await SessionNote.create([
    { connectionId: C.SA1, userId: simonId, content: 'Covered aperture, shutter speed, and the rule of thirds. Alex did great with manual mode.' },
    { connectionId: C.SA2, userId: alexId, content: 'Practised greetings and ordering food in Spanish. Simon is a fast learner.' },
    { connectionId: C.SJ1, userId: simonId, content: 'Shot food photos with natural light from the window. Jordan learned composition basics.' },
    { connectionId: C.SJ2, userId: jordanId, content: 'Made hummus, tabbouleh, and a green smoothie. Simon loved all three.' },
    { connectionId: C.AJ1, userId: alexId, content: 'Taught open chords G, C, and D. Jordan practiced strumming patterns.' },
    { connectionId: C.AJ2, userId: jordanId, content: 'Guided 15-minute breathing meditation. Alex said it improved his focus for coding.' },
  ]);
  console.log('  6 session notes');

  // ─── TIPS ────────────────────────────────────────────────────────────
  console.log('\n== Seeding tips ==');
  await Tip.create([
    { payerId: alexId, payeeId: simonId, connectionId: C.SA1, amount: 500, currency: 'usd', stripePaymentIntentId: 'pi_test_simon_1', status: 'completed', platformFee: 50 },
    { payerId: simonId, payeeId: alexId, connectionId: C.SA2, amount: 400, currency: 'usd', stripePaymentIntentId: 'pi_test_alex_1', status: 'completed', platformFee: 40 },
    { payerId: simonId, payeeId: jordanId, connectionId: C.SJ2, amount: 300, currency: 'usd', stripePaymentIntentId: 'pi_test_jordan_1', status: 'completed', platformFee: 30 },
    { payerId: jordanId, payeeId: simonId, connectionId: C.SJ1, amount: 350, currency: 'usd', status: 'pending', platformFee: 35 },
    { payerId: jordanId, payeeId: alexId, connectionId: C.AJ1, amount: 250, currency: 'usd', stripePaymentIntentId: 'pi_test_jordan_2', status: 'completed', platformFee: 25 },
  ]);
  console.log('  5 tips');

  // ─── BLOCK OUT DATES ─────────────────────────────────────────────────
  console.log('\n== Seeding block out dates ==');
  await BlockOutDate.create([
    { userId: simonId, date: daysFromNow(5), reason: 'Conference' },
    { userId: simonId, date: daysFromNow(12), reason: 'Weekend trip' },
    { userId: alexId, date: daysFromNow(3), reason: 'Work deadline' },
    { userId: jordanId, date: daysFromNow(7), reason: 'Family event' },
  ]);
  console.log('  4 block out dates');

  // ─── SKILL SUGGESTIONS ───────────────────────────────────────────────
  console.log('\n== Seeding skill suggestions ==');
  const SS: Record<string, Types.ObjectId> = {};
  await SkillSuggestion.create([
    { _id: (SS.SU1 = OID()), userId: simonId, skillName: 'Drone Photography', categoryName: 'Photography & Visual', description: 'Aerial photography with consumer drones.', status: 'pending', votes: 2, votedBy: [simonId, jordanId] },
    { _id: (SS.SU2 = OID()), userId: alexId, skillName: 'Ukulele', categoryName: 'Music & Arts', description: 'Easy beginner instrument, great for songwriting.', status: 'approved', votes: 3, votedBy: [simonId, alexId, jordanId], reviewedAt: daysAgo(2) },
    { _id: (SS.SU3 = OID()), userId: jordanId, skillName: 'Yoga', categoryName: 'Music & Performing Arts', description: 'Hatha and vinyasa yoga for all levels.', status: 'pending', votes: 1, votedBy: [jordanId] },
  ]);
  console.log('  3 skill suggestions');

  // ─── SKILL BUNDLES ───────────────────────────────────────────────────
  console.log('\n== Seeding skill bundles ==');
  const SB: Record<string, Types.ObjectId> = {};
  await SkillBundle.create([
    { _id: (SB.SB1 = OID()), name: 'Creative Starter Pack', description: 'Photography, music, and cooking basics.', skillIds: [S.SIMON_PHOTO, S.ALEX_GUITAR, S.JORDAN_COOK], isOfficial: false, createdBy: simonId, votes: 3, votedBy: [simonId, alexId, jordanId], coverImage: '' },
    { _id: (SB.SB2 = OID()), name: 'Mind & Body Bundle', description: 'Meditation and healthy cooking.', skillIds: [S.JORDAN_MEDITATE, S.JORDAN_COOK], isOfficial: false, createdBy: jordanId, votes: 2, votedBy: [simonId, alexId], coverImage: '' },
  ]);
  console.log('  2 skill bundles');

  // ─── REQUEST TEMPLATES ───────────────────────────────────────────────
  console.log('\n== Seeding request templates ==');
  await RequestTemplate.create([
    { title: 'Learn Photography', intro: "Hi! I'd love to learn photography from you.", body: 'I have a camera but need help with the basics. Are you available for a session?', categoryId: photoCat._id, categoryName: 'Photography & Visual Arts', isActive: true, createdBy: simonId },
    { title: 'Meditation Intro', intro: 'Hello! I want to start meditating.', body: 'I have never meditated before. Can you guide me through the basics?', categoryId: wellnessCat._id, categoryName: 'Music & Performing Arts', isActive: true, createdBy: jordanId },
  ]);
  console.log('  2 request templates');

  // ─── SKILL DEMAND SNAPSHOTS ──────────────────────────────────────────
  console.log('\n== Seeding skill demand snapshots ==');
  await SkillDemandSnapshot.create([
    { skills: [{ skillName: 'Photography', categoryName: 'Photography & Visual Arts', demandScore: 85, topRegions: [{ name: 'Gulshan', count: 12 }, { name: 'Banani', count: 8 }] }, { skillName: 'Spanish', categoryName: 'Languages & Communication', demandScore: 72, topRegions: [{ name: 'Gulshan', count: 6 }, { name: 'Dhanmondi', count: 5 }] }], windowStart: daysAgo(30), windowEnd: daysAgo(0) },
    { skills: [{ skillName: 'Healthy Cooking', categoryName: 'Food & Cooking', demandScore: 68, topRegions: [{ name: 'Dhanmondi', count: 9 }, { name: 'Banani', count: 7 }] }], windowStart: daysAgo(14), windowEnd: daysAgo(0) },
  ]);
  console.log('  2 demand snapshots');

  // ─── SKILL RADARS ────────────────────────────────────────────────────
  console.log('\n== Seeding skill radars ==');
  await SkillRadar.create([
    { userId: simonId, signals: [
      { type: 'search', category: 'Music & Arts', skillName: 'Guitar', timestamp: daysAgo(3), weight: 0.8 },
      { type: 'category_browse', category: 'Food & Cooking', timestamp: daysAgo(2), weight: 0.5 },
    ], intents: [
      { category: 'Music & Arts', inferredSkillNames: ['Guitar', 'Ukulele'], confidence: 'high', preferredFormat: 'in-person', preferredRadius: 10, reasoning: 'Searched for guitar and browsed music category', status: 'active', alertedSkillIds: [S.ALEX_GUITAR], matchCount: 1 },
    ], manualRadars: [{ name: 'Nearby music teachers', filters: { category: 'Music & Arts', type: 'teach', format: 'in-person', radius: 10 }, alertedSkillIds: [S.ALEX_GUITAR], matchCount: 1 }] },
    { userId: alexId, signals: [
      { type: 'skill_view', category: 'Food & Cooking', skillName: 'Healthy Cooking', timestamp: daysAgo(1), weight: 0.7 },
      { type: 'endorsement_given', category: 'Music & Performing Arts', timestamp: daysAgo(2), weight: 0.4 },
    ], intents: [
      { category: 'Food & Cooking', inferredSkillNames: ['Healthy Cooking', 'Meal Prep'], confidence: 'medium', preferredFormat: 'in-person', reasoning: 'Viewed cooking skills and endorsed wellness', status: 'active', alertedSkillIds: [S.JORDAN_COOK], matchCount: 1 },
    ], manualRadars: [] },
    { userId: jordanId, signals: [
      { type: 'search', category: 'Photography & Visual Arts', skillName: 'Photography', timestamp: daysAgo(0), weight: 0.9 },
      { type: 'skill_view', category: 'Music & Performing Arts', skillName: 'Guitar', timestamp: daysAgo(1), weight: 0.6 },
    ], intents: [
      { category: 'Photography & Visual Arts', inferredSkillNames: ['Photography', 'Food Photography'], confidence: 'high', preferredFormat: 'in-person', preferredRadius: 12, reasoning: 'Searched photography and viewed food photo showcases', status: 'active', alertedSkillIds: [S.SIMON_PHOTO], matchCount: 1 },
    ], manualRadars: [{ name: 'Photography near me', filters: { category: 'Photography & Visual Arts', type: 'teach', format: 'in-person', radius: 12 }, alertedSkillIds: [S.SIMON_PHOTO], matchCount: 1 }] },
  ]);
  console.log('  3 skill radars');

  // ─── SWAP READY MATCHES ──────────────────────────────────────────────
  console.log('\n== Seeding swap ready matches ==');
  const swapPairs = [
    { a: simonId, aSkill: S.SIMON_JS, b: alexId, bSkill: S.ALEX_SPANISH, last: daysAgo(1) },
    { a: simonId, aSkill: S.SIMON_PHOTO, b: jordanId, bSkill: S.JORDAN_COOK, last: daysAgo(2) },
    { a: alexId, aSkill: S.ALEX_GUITAR, b: jordanId, bSkill: S.JORDAN_MEDITATE, last: daysAgo(1) },
  ];
  for (const m of swapPairs) {
    const { a, b } = canonicalPair(String(m.a), String(m.b));
    const aIsA = a === String(m.a);
    await SwapReadyMatch.updateOne(
      { userAId: new Types.ObjectId(a), userATeachesSkillId: aIsA ? m.aSkill : m.bSkill, userBId: new Types.ObjectId(b), userBTeachesSkillId: aIsA ? m.bSkill : m.aSkill },
      { $setOnInsert: { status: 'available' }, $set: { lastMatchDate: m.last } },
      { upsert: true },
    );
  }
  console.log('  3 swap ready matches');

  // ─── CONVERSATION SETTINGS ───────────────────────────────────────────
  console.log('\n== Seeding conversation settings ==');
  const alexRoom = getDirectMessageRoomId(String(simonId), String(alexId));
  const jordanRoom = getDirectMessageRoomId(String(simonId), String(jordanId));
  const jordanAlexRoom = getDirectMessageRoomId(String(alexId), String(jordanId));
  await ConversationSettings.create([
    { userId: simonId, conversationId: alexRoom, conversationType: 'friend', isPinned: true, pinnedAt: daysAgo(10), isMuted: false, isArchived: false, notificationOverride: 'all', chatTheme: 'ocean' },
    { userId: simonId, conversationId: jordanRoom, conversationType: 'friend', isPinned: false, isMuted: false, isArchived: false, notificationOverride: 'default', chatTheme: 'default' },
    { userId: alexId, conversationId: alexRoom, conversationType: 'friend', isPinned: false, isMuted: false, isArchived: false, notificationOverride: 'default', chatTheme: 'default' },
    { userId: alexId, conversationId: jordanAlexRoom, conversationType: 'friend', isPinned: true, pinnedAt: daysAgo(5), isMuted: false, isArchived: false, notificationOverride: 'default', chatTheme: 'sunset' },
    { userId: jordanId, conversationId: jordanRoom, conversationType: 'friend', isPinned: false, isMuted: true, mutedUntil: daysFromNow(2), isArchived: false, notificationOverride: 'none', chatTheme: 'default' },
    { userId: jordanId, conversationId: jordanAlexRoom, conversationType: 'friend', isPinned: false, isMuted: false, isArchived: false, notificationOverride: 'default', chatTheme: 'default' },
  ]);
  console.log('  6 conversation settings');

  // ─── USER INBOX PREFERENCES ──────────────────────────────────────────
  console.log('\n== Seeding user inbox preferences ==');
  const saConn = C.SA1;
  const sjConn = C.SJ1;
  const ajConn = C.AJ1;
  await UserInboxPreference.create([
    { userId: simonId, connectionId: saConn, isPinned: true, isMuted: false, isArchived: false },
    { userId: simonId, connectionId: sjConn, isPinned: false, isMuted: false, isArchived: false },
    { userId: alexId, connectionId: saConn, isPinned: false, isMuted: false, isArchived: false },
    { userId: alexId, connectionId: ajConn, isPinned: true, isMuted: false, isArchived: false },
    { userId: jordanId, connectionId: sjConn, isPinned: false, isMuted: true, isArchived: false },
    { userId: jordanId, connectionId: ajConn, isPinned: false, isMuted: false, isArchived: false },
  ]);
  console.log('  6 inbox preferences');

  // ─── REPORTS ─────────────────────────────────────────────────────────
  console.log('\n== Seeding reports ==');
  await Report.create([
    { reporterId: simonId, targetType: 'post', targetId: P.P3, reason: 'inappropriate', description: 'This post might be self-promotional.', status: 'open' },
    { reporterId: alexId, targetType: 'user', targetId: jordanId, reason: 'other', description: 'Testing the report flow for this seed.', status: 'dismissed', action: 'no_action', resolution: 'Seed test report, no action needed.' },
  ]);
  console.log('  2 reports');

  // ─── BLOCKS ──────────────────────────────────────────────────────────
  console.log('\n== Seeding blocks ==');
  await Block.create([
    { blockerId: simonId, blockedId: jordanId },
  ]);
  console.log('  1 block');

  // ─── AUDIT LOGS ──────────────────────────────────────────────────────
  console.log('\n== Seeding audit logs ==');
  await AuditLog.create([
    { performedBy: simonId, action: 'update', targetType: 'skill', targetId: S.SIMON_PHOTO, after: { description: 'Updated skill description' }, metadata: {} },
    { performedBy: alexId, action: 'update', targetType: 'user', targetId: alexId, after: { bio: 'Updated bio' }, metadata: {} },
  ]);
  console.log('  2 audit logs');

  // ─── AUTH TOKENS ─────────────────────────────────────────────────────
  console.log('\n== Seeding auth tokens ==');
  await RefreshToken.create([
    { userId: simonId, tokenHash: 'hashed_refresh_simon', expiresAt: daysFromNow(30) },
    { userId: alexId, tokenHash: 'hashed_refresh_alex', expiresAt: daysFromNow(30) },
    { userId: jordanId, tokenHash: 'hashed_refresh_jordan', expiresAt: daysAgo(1), revokedAt: daysAgo(1) },
  ]);
  await EmailVerificationToken.create([
    { userId: simonId, tokenHash: 'hashed_verify_simon', expiresAt: daysAgo(10), isUsed: true },
    { userId: alexId, tokenHash: 'hashed_verify_alex', expiresAt: daysAgo(8), isUsed: true },
    { userId: jordanId, tokenHash: 'hashed_verify_jordan', expiresAt: daysAgo(5), isUsed: true },
  ]);
  await PasswordResetToken.create([
    { userId: simonId, tokenHash: 'hashed_reset_simon', expiresAt: daysFromNow(1) },
    { userId: alexId, tokenHash: 'hashed_reset_alex', expiresAt: daysAgo(3), isUsed: true },
  ]);
  await OAuthProvider.create([
    { userId: simonId, provider: 'google', providerUserId: 'google_simon_123', email: EMAIL_SIMON, displayName: 'Simon K.' },
    { userId: alexId, provider: 'google', providerUserId: 'google_alex_456', email: EMAIL_ALEX, displayName: 'Alex T.' },
  ]);
  await TwoFactorSecret.create([
    { userId: simonId, secret: 'JBSWY3DPEHPK3PXP', enabled: true, lastUsedAt: daysAgo(1) },
    { userId: alexId, secret: 'KRSXG5CTMVRXEZLU', enabled: false },
  ]);
  await TokenBlacklist.create([
    { tokenId: 'jti_blacklisted_simon', type: 'access', expiresAt: daysFromNow(1) },
    { tokenId: 'jti_blacklisted_jordan_refresh', type: 'refresh', expiresAt: daysFromNow(30) },
  ]);
  console.log('  auth tokens seeded');

  console.log('\n== Seeding SkillSwap records for canonical pairs ==');

  console.log('\n== Done ==');
  await disconnectDatabase();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
