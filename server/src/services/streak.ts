import { Types } from 'mongoose';
import { Streak, ActivityEvent, User } from '../models';
import type { StreakType } from '../models';
import { HttpError } from '../utils/errors';
import { awardXP } from './gamification';

const STREAK_MILESTONES = [7, 14, 30, 60, 90];

function toObjectId(value: string | Types.ObjectId): Types.ObjectId {
  return typeof value === 'string' ? new Types.ObjectId(value) : value;
}

function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isYesterday(a: Date, b: Date): boolean {
  const yesterday = new Date(a);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(yesterday, b);
}

export async function recordStreakActivity(userId: string | Types.ObjectId, type: StreakType) {
  const id = toObjectId(userId);
  const now = new Date();
  const today = startOfLocalDay(now);

  let streak = await Streak.findOne({ userId: id, type });
  if (!streak) {
    streak = await Streak.create({
      userId: id,
      type,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: today,
      streakStartDate: today,
      freezesAvailable: 1,
      milestones: [],
    });
  } else {
    const last = streak.lastActivityDate ? startOfLocalDay(streak.lastActivityDate) : null;

    if (last && isSameDay(last, today)) {
      return streak.toJSON();
    }

    if (last && isYesterday(last, today)) {
      streak.currentStreak += 1;
    } else if (last) {
      if (streak.freezesAvailable > 0 && streak.frozenUntil && streak.frozenUntil >= now) {
        streak.freezesAvailable -= 1;
        streak.currentStreak += 1;
      } else {
        streak.currentStreak = 1;
        streak.streakStartDate = today;
        streak.freezesUsed = 0;
      }
    }

    streak.lastActivityDate = today;
    if (!streak.streakStartDate) streak.streakStartDate = today;
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }
    await streak.save();
  }

  const reachedMilestones = STREAK_MILESTONES.filter(
    (m) => streak.currentStreak >= m && !streak.milestones.includes(m),
  );
  for (const milestone of reachedMilestones) {
    streak.milestones.push(milestone);
    await streak.save();
    try {
      await ActivityEvent.create({
        actorId: id,
        eventType: 'streak_milestone',
        subjectType: 'streak',
        preview: {
          title: `${milestone}-day ${type} streak! 🔥`,
          subtitle: type === 'teaching' ? 'Keep sharing your skills' : type === 'learning' ? 'Keep learning' : 'Keep journaling',
          emoji: '🔥',
        },
        visibility: 'friends',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      });
    } catch {
      // best-effort
    }

    const milestoneAction =
      milestone === 90 ? 'streak_90_day' : milestone === 30 ? 'streak_30_day' : 'streak_7_day';
    await awardXP(id, milestoneAction as 'streak_90_day');
  }

  return streak.toJSON();
}

export async function getUserStreaks(userId: string | Types.ObjectId) {
  const id = toObjectId(userId);
  const streaks = await Streak.find({ userId: id }).lean();
  return streaks.map((s) => ({
    type: s.type,
    currentStreak: s.currentStreak,
    longestStreak: s.longestStreak,
    lastActivityDate: s.lastActivityDate ?? undefined,
    streakStartDate: s.streakStartDate ?? undefined,
    freezesAvailable: s.freezesAvailable,
    frozenUntil: s.frozenUntil ?? undefined,
    milestones: s.milestones,
  }));
}

export async function useStreakFreeze(userId: string | Types.ObjectId, type: StreakType) {
  const id = toObjectId(userId);
  const streak = await Streak.findOne({ userId: id, type });
  if (!streak) {
    throw new HttpError(400, 'NO_STREAK', 'You do not have an active streak of this type');
  }
  if (streak.freezesAvailable <= 0) {
    throw new HttpError(400, 'NO_FREEZES', 'You have no streak freezes available');
  }

  const now = new Date();
  streak.freezesAvailable -= 1;
  streak.frozenUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  await streak.save();

  return streak.toJSON();
}

export async function getFriendsStreaks(userId: string) {
  const user = await User.findById(userId).select('friendIds').lean();
  if (!user || !user.friendIds?.length) return [];

  const friendIds = user.friendIds;
  const streaks = await Streak.find({ userId: { $in: friendIds } })
    .populate('userId', 'displayName avatar')
    .sort({ currentStreak: -1 })
    .lean();

  return streaks.map((s) => {
    const owner = s.userId as unknown as { _id: Types.ObjectId; displayName: string; avatar: string };
    return {
      userId: String(owner._id),
      displayName: owner.displayName,
      avatar: owner.avatar,
      type: s.type,
      currentStreak: s.currentStreak,
      longestStreak: s.longestStreak,
    };
  });
}

export async function getStreakStatus(userId: string | Types.ObjectId) {
  const id = toObjectId(userId);
  const streaks = await getUserStreaks(id);
  return streaks.map((s) => {
    let atRisk = false;
    if (s.lastActivityDate) {
      const last = startOfLocalDay(new Date(s.lastActivityDate));
      const today = startOfLocalDay(new Date());
      const dayDiff = Math.floor((today.getTime() - last.getTime()) / (24 * 60 * 60 * 1000));
      atRisk = dayDiff >= 1 && !(s.frozenUntil && s.frozenUntil >= new Date());
    }
    return { ...s, atRisk };
  });
}
