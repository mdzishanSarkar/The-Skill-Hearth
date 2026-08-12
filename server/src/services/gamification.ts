import { Types } from 'mongoose';
import { User, Streak, ActivityEvent } from '../models';
import { HttpError } from '../utils/errors';

export const XP_REWARDS = {
  register: 20,
  complete_profile: 50,
  add_first_skill: 30,
  add_skill: 15,
  add_photo: 20,
  set_location: 15,
  complete_onboarding: 75,
  session_completed_teaching: 40,
  session_completed_learning: 25,
  received_5_star_review: 30,
  leave_review: 15,
  journal_entry: 15,
  first_friend: 20,
  send_friend_request: 5,
  accept_friend_request: 20,
  accept_swap: 30,
  complete_skill_swap: 50,
  streak_7_day: 50,
  streak_14_day: 100,
  streak_30_day: 250,
  streak_90_day: 1000,
  community_post_upvoted: 5,
} as const;

export type XPAction = keyof typeof XP_REWARDS;

export interface LevelInfo {
  level: number;
  name: string;
  xpRequired: number;
  icon: string;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Spark', xpRequired: 0, icon: '✨' },
  { level: 2, name: 'Kindler', xpRequired: 100, icon: '🕯️' },
  { level: 3, name: 'Flame', xpRequired: 300, icon: '🔥' },
  { level: 4, name: 'Hearth Keeper', xpRequired: 600, icon: '🏠' },
  { level: 5, name: 'Torchbearer', xpRequired: 1000, icon: '🔦' },
  { level: 6, name: 'Beacon', xpRequired: 2000, icon: '🗼' },
  { level: 7, name: 'Luminary', xpRequired: 4000, icon: '⭐' },
  { level: 8, name: 'Elder Flame', xpRequired: 8000, icon: '🌟' },
  { level: 9, name: 'Community Light', xpRequired: 15000, icon: '💫' },
  { level: 10, name: 'Skill Sage', xpRequired: 30000, icon: '🌞' },
];

export interface BadgeInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const BADGES: BadgeInfo[] = [
  { id: 'first_spark', name: 'First Spark', emoji: '✨', description: 'Added your first skill' },
  { id: 'full_profile', name: 'Open Book', emoji: '📖', description: 'Completed your profile' },
  { id: 'ready_to_share', name: 'Ready to Share', emoji: '🤝', description: 'First accepted request' },
  { id: 'first_session', name: 'Debut Teacher', emoji: '🎓', description: 'Taught your first session' },
  { id: 'ten_sessions', name: 'Regular Teacher', emoji: '📚', description: 'Taught 10 sessions' },
  { id: 'fifty_sessions', name: 'Dedicated Teacher', emoji: '🏅', description: 'Taught 50 sessions' },
  { id: 'hundred_sessions', name: 'Century Teacher', emoji: '💯', description: 'Taught 100 sessions' },
  { id: 'five_star_debut', name: 'Gold Standard', emoji: '⭐', description: 'Received your first 5-star review' },
  { id: 'first_friend', name: 'Better Together', emoji: '👥', description: 'Made your first friend' },
  { id: 'ten_friends', name: 'Circle Builder', emoji: '🔄', description: 'Made 10 friends' },
  { id: 'skill_swapper', name: 'Fair Trader', emoji: '🔀', description: 'Completed a skill swap' },
  { id: 'streak_7', name: 'Week Warrior', emoji: '🔥', description: 'Reached a 7-day streak' },
  { id: 'streak_30', name: 'Monthly Flame', emoji: '🔥🔥', description: 'Reached a 30-day streak' },
  { id: 'streak_90', name: 'Eternal Flame', emoji: '🔥🔥🔥', description: 'Reached a 90-day streak' },
  { id: 'multi_skill', name: 'Renaissance Person', emoji: '🎨', description: 'Have 5+ active skills' },
  { id: 'early_adopter', name: 'Founding Flame', emoji: '🌅', description: 'One of the first members' },
  { id: 'local_legend', name: 'Local Legend', emoji: '📍', description: 'Top teacher in your neighbourhood' },
];

const BADGE_EVENTS: Record<string, string> = {
  first_spark: 'badge_earned',
  first_friend: 'badge_earned',
  ten_friends: 'badge_earned',
  streak_7: 'streak_milestone',
  streak_30: 'streak_milestone',
  streak_90: 'streak_milestone',
};

export function getLevelForXp(xp: number): LevelInfo {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.xpRequired) current = level;
    else break;
  }
  return current;
}

function toObjectId(value: string | Types.ObjectId): Types.ObjectId {
  return typeof value === 'string' ? new Types.ObjectId(value) : value;
}

export async function ensureGamification(userId: string | Types.ObjectId): Promise<void> {
  const id = toObjectId(userId);
  const user = await User.findById(id).select('gamification createdAt').lean();
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');

  if (user.gamification?.xp > 0) return;

  const referralCode = `SH-${id.toString().slice(-6).toUpperCase()}`;
  await User.updateOne(
    { _id: id },
    {
      $set: {
        'gamification.xp': XP_REWARDS.register,
        'gamification.level': 1,
        'gamification.referralCode': referralCode,
        'gamification.lastXPAction': new Date(),
      },
    }
  );
}

export async function awardXP(
  userId: string | Types.ObjectId,
  action: XPAction,
  options: { sourceType?: string; sourceId?: string | Types.ObjectId } = {}
): Promise<void> {
  const id = toObjectId(userId);
  const reward = XP_REWARDS[action];
  if (!reward) return;

  const user = await User.findById(id).select('gamification xpLevel friendCount stats');
  if (!user) return;

  if (!user.gamification) {
    await ensureGamification(id);
  }

  const beforeLevel = getLevelForXp(user.gamification?.xp ?? 0);
  const newXp = (user.gamification?.xp ?? 0) + reward;
  const afterLevel = getLevelForXp(newXp);

  const update: Record<string, unknown> = {
    'gamification.xp': newXp,
    'gamification.level': afterLevel.level,
    'gamification.lastXPAction': new Date(),
  };

  if (action === 'first_friend' || action === 'accept_friend_request') {
    update['gamification.streakFreezeAvailable'] = (user.gamification?.streakFreezeAvailable ?? 1) + 1;
  }

  await User.updateOne({ _id: id }, { $set: update });

  if (afterLevel.level > beforeLevel.level) {
    try {
      await ActivityEvent.create({
        actorId: id,
        eventType: 'level_up',
        subjectType: 'badge',
        preview: {
          title: `Reached level ${afterLevel.level}: ${afterLevel.name} ${afterLevel.icon}`,
          subtitle: `${newXp} XP earned so far`,
          emoji: afterLevel.icon,
        },
        visibility: 'friends',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      });
    } catch {
      // best-effort
    }
  }
}

export async function getGamificationProfile(userId: string) {
  const id = toObjectId(userId);

  const [user, streaks] = await Promise.all([
    User.findById(id)
      .select('gamification friendIds closeFriendIds stats feedVisibility')
      .lean(),
    Streak.find({ userId: id }).lean(),
  ]);

  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');

  await ensureGamification(id);

  const fresh = await User.findById(id).select('gamification').lean();
  const xp = fresh?.gamification?.xp ?? 0;
  const levelInfo = getLevelForXp(xp);
  const nextLevel = LEVELS.find((l) => l.level === levelInfo.level + 1) ?? null;
  const currentLevelFloor = levelInfo.xpRequired;
  const nextLevelFloor = nextLevel ? nextLevel.xpRequired : currentLevelFloor;
  const progress = nextLevel
    ? Math.min(100, Math.round(((xp - currentLevelFloor) / (nextLevelFloor - currentLevelFloor)) * 100))
    : 100;

  const badgeInfos = BADGES.map((badge) => ({
    ...badge,
    earned: (fresh?.gamification?.badges ?? []).includes(badge.id),
  }));

  return {
    xp,
    level: levelInfo,
    nextLevel,
    progressToNextLevel: progress,
    badges: badgeInfos,
    earnedBadgeIds: fresh?.gamification?.badges ?? [],
    streakFreezeAvailable: fresh?.gamification?.streakFreezeAvailable ?? 1,
    referralCode: fresh?.gamification?.referralCode ?? '',
    stats: user.stats,
    friendCount: user.friendIds?.length ?? 0,
    streaks: streaks.map((s) => ({
      type: s.type,
      currentStreak: s.currentStreak,
      longestStreak: s.longestStreak,
      lastActivityDate: s.lastActivityDate ?? undefined,
      freezesAvailable: s.freezesAvailable,
      frozenUntil: s.frozenUntil ?? undefined,
    })),
  };
}

export async function getPublicGamification(userId: string) {
  const id = toObjectId(userId);
  const user = await User.findById(id).select('gamification').lean();
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');

  const xp = user.gamification?.xp ?? 0;
  return {
    level: getLevelForXp(xp),
    xp,
    badges: BADGES.filter((b) => (user.gamification?.badges ?? []).includes(b.id)),
    friendCount: await getFriendCount(id),
  };
}

async function getFriendCount(userId: Types.ObjectId): Promise<number> {
  const user = await User.findById(userId).select('friendIds').lean();
  return user?.friendIds?.length ?? 0;
}

export async function getLeaderboard(userId: string, scope: 'global' | 'local' = 'local') {
  const id = toObjectId(userId);
  const user = await User.findById(id).select('location city neighborhood').lean();
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');

  const filter: Record<string, unknown> = {
    'gamification.xp': { $gt: 0 },
    status: 'active',
  };
  if (scope === 'local' && user.location?.city) {
    filter['location.city'] = user.location.city;
  }

  const entries = await User.find(filter)
    .select('displayName avatar location.city gamification')
    .sort({ 'gamification.xp': -1 })
    .limit(50)
    .lean();

  const myRank = entries.findIndex((e) => String(e._id) === userId) + 1;
  const sanitized = entries.map((e) => ({
    _id: String(e._id),
    displayName: e.displayName,
    avatar: e.avatar,
    city: e.location?.city ?? '',
    xp: e.gamification?.xp ?? 0,
    level: e.gamification?.level ?? 1,
  }));

  return { entries: sanitized, myRank: myRank > 0 ? myRank : null, scope };
}

export async function awardBadge(
  userId: string | Types.ObjectId,
  badgeId: string,
): Promise<boolean> {
  const id = toObjectId(userId);
  const user = await User.findById(id).select('gamification');
  if (!user) return false;
  if ((user.gamification?.badges ?? []).includes(badgeId)) return false;

  const badge = BADGES.find((b) => b.id === badgeId);
  if (!badge) return false;

  await User.updateOne({ _id: id }, { $addToSet: { 'gamification.badges': badgeId } });

  try {
    const eventType = (BADGE_EVENTS[badgeId] ?? 'badge_earned') as
      | 'badge_earned'
      | 'streak_milestone';
    await ActivityEvent.create({
      actorId: id,
      eventType,
      subjectType: 'badge',
      preview: {
        title: `Earned: ${badge.name} ${badge.emoji}`,
        subtitle: badge.description,
        emoji: badge.emoji,
      },
      visibility: 'friends',
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
  } catch {
    // best-effort
  }

  return true;
}
