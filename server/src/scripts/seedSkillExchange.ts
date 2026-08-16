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
  Notification,
  Friendship,
  SwapReadyMatch,
} from '../models';

const EMAIL_SIMON = 'simoksimon147@gmail.com';
const EMAIL_ALEX = 'partoftech150@gmail.com';

const H = 3600 * 1000;
const D = 24 * H;
const daysAgo = (n: number) => new Date(Date.now() - n * D);
const hoursAgo = (n: number) => new Date(Date.now() - n * H);
const OID = () => new Types.ObjectId();

const TLV: [number, number] = [34.7818, 32.0853];
const SIMON_LOCATION = {
  city: 'tel aviv',
  zipCode: '6688130',
  neighborhood: 'Rothschild Boulevard',
  type: 'Point',
  coordinates: TLV,
  radiusPreference: 15,
} as const;
const ALEX_LOCATION = {
  city: 'tel aviv',
  zipCode: '6810421',
  neighborhood: 'Rothschild Boulevard',
  type: 'Point',
  coordinates: TLV,
  radiusPreference: 15,
} as const;

const EVENINGS = [
  { day: 'wednesday', startTime: '18:00', endTime: '21:00' },
  { day: 'thursday', startTime: '18:00', endTime: '21:00' },
  { day: 'sunday', startTime: '10:00', endTime: '14:00' },
];

const SIMON_BADGES = [
  'first_spark', 'full_profile', 'ready_to_share', 'first_session', 'first_friend',
  'skill_swapper', 'five_star_debut', 'multi_skill', 'early_adopter', 'streak_7',
];
const ALEX_BADGES = [
  'first_spark', 'full_profile', 'first_session', 'first_friend',
  'skill_swapper', 'five_star_debut', 'early_adopter', 'streak_7',
];

async function findUserByEmail(email: string): Promise<Types.ObjectId> {
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

  const simonId = await findUserByEmail(EMAIL_SIMON);
  const alexId = await findUserByEmail(EMAIL_ALEX);
  const both = [simonId, alexId];

  console.log('\n== Cleaning existing test data ==');
  await Skill.deleteMany({ userId: { $in: both } });
  await Notification.deleteMany({ userId: { $in: both } });
  const existingConns = await Connection.find({
    $or: [{ requesterId: { $in: both } }, { teacherId: { $in: both } }],
  }).select('_id').lean();
  const existingConnIds = existingConns.map((c) => c._id);
  await Message.deleteMany({
    $or: [{ connectionId: { $in: existingConnIds } }, { senderId: { $in: both } }],
  });
  await Connection.deleteMany({
    $or: [{ requesterId: { $in: both } }, { teacherId: { $in: both } }],
  });
  await Review.deleteMany({
    $or: [{ reviewerId: { $in: both } }, { revieweeId: { $in: both } }],
  });
  await Friendship.deleteMany({
    $or: [{ requesterId: { $in: both } }, { addresseeId: { $in: both } }],
  });
  await SwapReadyMatch.deleteMany({
    $or: [{ userAId: { $in: both } }, { userBId: { $in: both } }],
  });

  console.log('\n== Updating profiles ==');
  const simonLevel = getLevelForXp(1500).level;
  const alexLevel = getLevelForXp(1100).level;
  await User.updateOne(
    { _id: simonId },
    {
      $set: {
        displayName: 'Simon K.',
        bio: 'I teach photography and JavaScript, and I am currently learning Spanish and guitar. Big fan of community-driven learning.',
        location: SIMON_LOCATION,
        availability: EVENINGS,
        stats: { sessionsCompleted: 17, averageRating: 4.8, reviewCount: 7 },
        'gamification.xp': 1500,
        'gamification.level': simonLevel,
        'gamification.badges': SIMON_BADGES,
        friendIds: [alexId],
        closeFriendIds: [],
        isEmailVerified: true,
        hasCompletedOnboarding: true,
      },
    },
  );
  await User.updateOne(
    { _id: alexId },
    {
      $set: {
        displayName: 'Alex T.',
        bio: 'I teach photography, Spanish, and guitar, and I am currently learning JavaScript. Always happy to swap skills!',
        location: ALEX_LOCATION,
        availability: EVENINGS,
        stats: { sessionsCompleted: 13, averageRating: 4.5, reviewCount: 6 },
        'gamification.xp': 1100,
        'gamification.level': alexLevel,
        'gamification.badges': ALEX_BADGES,
        friendIds: [simonId],
        closeFriendIds: [],
        isEmailVerified: true,
        hasCompletedOnboarding: true,
      },
    },
  );
  console.log('  simon and alex profiles updated');

  console.log('\n== Creating skills ==');
  const photoCat = await findCategoryId('photography-visual');
  const techCat = await findCategoryId('technology-web');
  const musicCat = await findCategoryId('music-arts');
  const langCat = await findCategoryId('languages-communication');

  const skillDefs = [
    {
      key: 'SIMON_PHOTO', userId: simonId, type: 'teach', cat: photoCat,
      name: 'Photography', desc: 'Learn composition, light and the rule of thirds. I have been shooting street and portrait photography for years.',
      prof: 'advanced', format: 'in-person', len: '1hr', stats: { averageRating: 4.8, reviewCount: 3, completedSessionCount: 6 },
    },
    {
      key: 'SIMON_JS', userId: simonId, type: 'teach', cat: techCat,
      name: 'JavaScript', desc: 'Web development fundamentals in JavaScript, from variables to building your first interactive page.',
      prof: 'advanced', format: 'online', len: '2hr+', stats: { averageRating: 4.7, reviewCount: 2, completedSessionCount: 5 },
    },
    {
      key: 'SIMON_SPANISH_LEARN', userId: simonId, type: 'learn', cat: langCat,
      name: 'Spanish', desc: 'I want to hold a real conversation in Spanish. Beginner with some basics.',
      prof: 'beginner', format: 'either', len: '1hr',
    },
    {
      key: 'SIMON_GUITAR_LEARN', userId: simonId, type: 'learn', cat: musicCat,
      name: 'Guitar', desc: 'I want to learn acoustic guitar from zero.',
      prof: 'beginner', format: 'in-person', len: '1hr',
    },
    {
      key: 'ALEX_PHOTO', userId: alexId, type: 'teach', cat: photoCat,
      name: 'Photography', desc: 'I will help you shoot with confidence, understand light and composition, and edit like a pro.',
      prof: 'intermediate', format: 'in-person', len: '1hr', stats: { averageRating: 4.4, reviewCount: 3, completedSessionCount: 7 },
    },
    {
      key: 'ALEX_SPANISH', userId: alexId, type: 'teach', cat: langCat,
      name: 'Spanish', desc: 'Conversational Spanish for everyday life. We will practice speaking from day one.',
      prof: 'intermediate', format: 'in-person', len: '1hr', stats: { averageRating: 4.5, reviewCount: 3, completedSessionCount: 6 },
    },
    {
      key: 'ALEX_GUITAR', userId: alexId, type: 'teach', cat: musicCat,
      name: 'Guitar', desc: 'Acoustic guitar basics: chords, strumming and your first songs.',
      prof: 'intermediate', format: 'in-person', len: '1hr', stats: { averageRating: 4.6, reviewCount: 2, completedSessionCount: 4 },
    },
    {
      key: 'ALEX_JS_LEARN', userId: alexId, type: 'learn', cat: techCat,
      name: 'JavaScript', desc: 'I want to learn JavaScript and build my own projects.',
      prof: 'beginner', format: 'online', len: '2hr+',
    },
  ];

  const S: Record<string, Types.ObjectId> = {};
  for (const def of skillDefs as any[]) {
    const id = OID();
    S[def.key] = id;
    await Skill.create({
      _id: id,
      userId: def.userId,
      type: def.type,
      categoryId: def.cat._id,
      categoryName: def.cat.name,
      skillName: def.name,
      description: def.desc,
      proficiencyLevel: def.prof,
      format: def.format,
      sessionLength: def.len,
      isActive: true,
      isDeleted: false,
      media: [],
      location: {
        city: def.userId === simonId ? 'tel aviv' : 'tel aviv',
        zipCode: def.userId === simonId ? '6688130' : '6810421',
        neighborhood: 'Rothschild Boulevard',
        type: 'Point',
        coordinates: TLV,
        radiusPreference: 15,
      },
      stats: def.stats ?? { averageRating: 0, reviewCount: 0, completedSessionCount: 0 },
    });
    console.log(`  skill: ${def.key}`);
  }

  console.log('\n== Creating connections ==');
  const C: Record<string, Types.ObjectId> = {};
  const connInputs = [
    {
      key: 'CONN1', requester: alexId, teacher: simonId, skill: 'SIMON_PHOTO', status: 'completed',
      message: 'I would love to learn photography from you. I am a complete beginner with a DSLR.',
      responseMessage: 'Great to hear! I would be happy to help. Let us start with the basics this weekend.',
      proposedFormat: 'in-person', completedAt: daysAgo(14), createdAt: daysAgo(21),
    },
    {
      key: 'CONN2', requester: simonId, teacher: alexId, skill: 'ALEX_SPANISH', status: 'completed',
      message: 'I would love to learn Spanish with you. I only know a few words so far.',
      responseMessage: 'Perfect, we will start from the very beginning. Saturday at 4 PM at Tazza?',
      proposedFormat: 'in-person', completedAt: daysAgo(7), createdAt: daysAgo(14),
    },
    {
      key: 'CONN3', requester: simonId, teacher: alexId, skill: 'ALEX_GUITAR', status: 'accepted',
      message: 'I have always wanted to play the guitar. Are you still up for teaching?',
      responseMessage: 'Absolutely! Bring your guitar and we will start with three chords.',
      proposedFormat: 'in-person', createdAt: daysAgo(4),
    },
    {
      key: 'CONN4', requester: alexId, teacher: simonId, skill: 'SIMON_JS', status: 'accepted',
      message: 'I want to learn JavaScript and build my own projects. Can you help me get started?',
      responseMessage: 'Definitely. We can meet online and I will show you the ropes.',
      proposedFormat: 'online', createdAt: daysAgo(2),
    },
  ];
  for (const input of connInputs as any[]) {
    C[input.key] = OID();
    await Connection.create({
      _id: C[input.key],
      requesterId: input.requester,
      teacherId: input.teacher,
      skillId: S[input.skill],
      status: input.status,
      message: input.message,
      responseMessage: input.responseMessage,
      proposedFormat: input.proposedFormat,
      completedAt: input.completedAt,
      createdAt: input.createdAt,
    });
    console.log(`  connection: ${input.key}`);
  }

  console.log('\n== Creating messages ==');
  const M: Record<string, Types.ObjectId> = {};
  const msgInputs = [
    {
      key: 'M1', conn: 'CONN2', sender: simonId, content: 'Hey Alex! So excited to finally get started. Are you still open to this Saturday at 4:00 PM?',
      createdAt: hoursAgo(150), readAt: hoursAgo(149), deliveredAt: hoursAgo(149),
    },
    {
      key: 'M2', conn: 'CONN2', sender: alexId, content: 'Simon, yes! I was hoping you would reach out. Saturday works for me. Coffee at Tazza? Meet you at the counter.',
      createdAt: hoursAgo(149), readAt: hoursAgo(148), deliveredAt: hoursAgo(148),
    },
    {
      key: 'M3', conn: 'CONN2', sender: simonId, content: 'Perfect. I will be there. Also, I finally understand the subjunctive, thanks to your Spanish class!',
      createdAt: hoursAgo(148), readAt: hoursAgo(147), deliveredAt: hoursAgo(147),
    },
    {
      key: 'M4', conn: 'CONN2', sender: alexId, content: 'Wait, it was YOUR Spanish class. Unless you are teaching me the rules right now. Either way, I will see you on Saturday!',
      createdAt: hoursAgo(147), readAt: hoursAgo(146), deliveredAt: hoursAgo(146),
    },
    {
      key: 'M5', conn: 'CONN2', sender: simonId, content: 'Ha! That is not how I remember it. I will bring the notes. See you Saturday!',
      createdAt: hoursAgo(146), readAt: hoursAgo(145), deliveredAt: hoursAgo(145),
    },
    {
      key: 'M6', conn: 'CONN2', sender: alexId, content: 'Simon, could you send me the notes before Saturday? I want to practice a little.',
      createdAt: hoursAgo(24), readAt: undefined, deliveredAt: hoursAgo(24),
    },
    {
      key: 'M7', conn: 'CONN1', sender: alexId, content: 'Simon, thank you so much for the photography session! I already feel way more confident behind my camera.',
      createdAt: hoursAgo(320), readAt: hoursAgo(319), deliveredAt: hoursAgo(319),
    },
    {
      key: 'M8', conn: 'CONN1', sender: simonId, content: 'Anytime, Alex! You picked it up fast. Let me know when you are ready for a follow-up.',
      createdAt: hoursAgo(318), readAt: hoursAgo(317), deliveredAt: hoursAgo(317),
    },
  ];
  for (const input of msgInputs) {
    M[input.key] = OID();
    await Message.create({
      _id: M[input.key],
      connectionId: C[input.conn],
      senderId: input.sender,
      content: input.content,
      type: 'text',
      readAt: input.readAt,
      deliveredAt: input.deliveredAt,
      isReported: false,
      reactions: [],
      isDeleted: false,
      createdAt: input.createdAt,
    });
    console.log(`  message: ${input.key}`);
  }

  console.log('\n== Creating reviews ==');
  const R: Record<string, Types.ObjectId> = {};
  const reviewInputs = [
    {
      key: 'R1', conn: 'CONN1', reviewer: alexId, reviewee: simonId, skill: 'SIMON_PHOTO', rating: 5,
      content: 'Simon is an incredibly patient and talented photography teacher. He explained light, composition and the rule of thirds in a way that made it feel effortless. I already feel way more confident behind my camera.',
      tags: ['Patient teacher', 'Clear explanations', 'Enthusiastic'], wouldRecommend: true,
    },
    {
      key: 'R2', conn: 'CONN2', reviewer: simonId, reviewee: alexId, skill: 'ALEX_SPANISH', rating: 5,
      content: 'Alex makes Spanish feel easy and fun. We laughed, we spoke, and I left confident enough to hold a real conversation.',
      tags: ['Engaging', 'Enthusiastic'], wouldRecommend: true,
    },
  ];
  for (const input of reviewInputs as any[]) {
    R[input.key] = OID();
    await Review.create({
      _id: R[input.key],
      connectionId: C[input.conn],
      reviewerId: input.reviewer,
      revieweeId: input.reviewee,
      skillId: S[input.skill],
      rating: input.rating,
      content: input.content,
      tags: input.tags,
      wouldRecommend: input.wouldRecommend,
    });
    console.log(`  review: ${input.key}`);
  }

  console.log('\n== Creating friendship ==');
  await Friendship.create({
    requesterId: simonId,
    addresseeId: alexId,
    status: 'accepted',
    requesterTier: 'friend',
    addresseeTier: 'friend',
    showStreakTo: { requester: true, addressee: true },
    metVia: 'skill_session',
    sharedSkillId: S.SIMON_PHOTO,
    directMessageRoomId: getDirectMessageRoomId(String(simonId), String(alexId)),
    acceptedAt: daysAgo(30),
  });
  console.log('  friendship: simon <-> alex');

  console.log('\n== Creating notifications ==');
  const notificationInputs = [
    { user: simonId, type: 'request_received', refModel: 'Connection', ref: 'CONN4', message: 'Alex T. wants to learn JavaScript from you.', isRead: false },
    { user: simonId, type: 'request_accepted', refModel: 'Connection', ref: 'CONN3', message: 'Alex T. accepted your request to learn Guitar.', isRead: false },
    { user: simonId, type: 'review_received', refModel: 'Review', ref: 'R1', message: 'Alex T. reviewed you 5 stars after your photography session.', isRead: false },
    { user: simonId, type: 'new_message', refModel: 'Message', ref: 'M6', message: 'New message from Alex T.', isRead: false },
    { user: alexId, type: 'request_received', refModel: 'Connection', ref: 'CONN2', message: 'Simon K. wants to learn Spanish from you.', isRead: true },
    { user: alexId, type: 'request_accepted', refModel: 'Connection', ref: 'CONN4', message: 'Simon K. accepted your request to learn JavaScript.', isRead: true },
    { user: alexId, type: 'review_received', refModel: 'Review', ref: 'R2', message: 'Simon K. reviewed you 5 stars after your Spanish session.', isRead: false },
  ];
  for (const input of notificationInputs as any[]) {
    await Notification.create({
      userId: input.user,
      type: input.type,
      referenceId: C[input.ref] ?? R[input.ref] ?? M[input.ref],
      referenceModel: input.refModel,
      message: input.message,
      isRead: input.isRead,
    });
  }
  console.log('  notifications created');

  console.log('\n== Creating swap-ready matches ==');
  const { a, b } = canonicalPair(String(simonId), String(alexId));
  const simonIsA = a === String(simonId);
  const matches = [
    { aTeach: simonIsA ? S.SIMON_JS : S.ALEX_SPANISH, bTeach: simonIsA ? S.ALEX_SPANISH : S.SIMON_JS, last: daysAgo(1) },
    { aTeach: simonIsA ? S.SIMON_JS : S.ALEX_GUITAR, bTeach: simonIsA ? S.ALEX_GUITAR : S.SIMON_JS, last: daysAgo(2) },
  ];
  for (const m of matches) {
    await SwapReadyMatch.updateOne(
      {
        userAId: new Types.ObjectId(a),
        userATeachesSkillId: m.aTeach,
        userBId: new Types.ObjectId(b),
        userBTeachesSkillId: m.bTeach,
      },
      { $setOnInsert: { status: 'available' }, $set: { lastMatchDate: m.last } },
      { upsert: true },
    );
  }
  console.log('  swap-ready matches created');

  console.log('\n== Done ==');
  await disconnectDatabase();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
