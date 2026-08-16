import { Types } from 'mongoose';
import { Skill, SwapReadyMatch, User } from '../models';
import type { ISkillSwap } from '../models/SkillSwap';
import { getBlockedIds } from './block.service';
import { HttpError } from '../utils/errors';
import * as swapService from './swap';

function nameRegex(name: string): RegExp {
  return new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

function canonicalPair(userAId: string, userBId: string): { a: string; b: string } {
  return userAId < userBId ? { a: userAId, b: userBId } : { a: userBId, b: userAId };
}

function pairKey(a: string, aTeach: string, b: string, bTeach: string): string {
  return `${a}:${aTeach}:${b}:${bTeach}`;
}

const MATCH_POPULATE = [
  { path: 'userAId', select: 'displayName avatar status location' },
  { path: 'userBId', select: 'displayName avatar status location' },
  { path: 'userATeachesSkillId', select: 'skillName categoryName format' },
  { path: 'userBTeachesSkillId', select: 'skillName categoryName format' },
];

export function toObjectId(value: string | Types.ObjectId): Types.ObjectId {
  return new Types.ObjectId(value);
}

/**
 * Recompute all swap-ready matches for a user. Creates or refreshes available
 * matches for every reciprocal teach/learn pair and removes stale available
 * matches whose skill pairs are no longer valid. Non-`available` matches
 * (hidden/proposed/accepted/declined) are never overwritten or removed.
 */
export async function recomputeMatchesForUser(userId: string): Promise<void> {
  const user = await User.findById(userId).select('status isShadowBanned');
  if (!user || user.status !== 'active' || user.isShadowBanned) return;

  const userSkills = await Skill.find({
    userId: toObjectId(userId),
    isDeleted: false,
    isActive: true,
  }).lean();
  const teachSkills = userSkills.filter((s) => s.type === 'teach');
  const learnSkills = userSkills.filter((s) => s.type === 'learn');

  if (teachSkills.length === 0 || learnSkills.length === 0) {
    await SwapReadyMatch.deleteMany({
      $or: [{ userAId: toObjectId(userId) }, { userBId: toObjectId(userId) }],
      status: 'available',
    });
    return;
  }

  const blockedIds = (await getBlockedIds(userId)).map((b) => new Types.ObjectId(b));
  const teachSkillMap = new Map<string, string>();
  for (const s of teachSkills) teachSkillMap.set(s.skillName.toLowerCase(), String(s._id));
  const learnSkillNames = learnSkills.map((s) => s.skillName.toLowerCase());
  const teachSkillNames = [...teachSkillMap.keys()];

  // People who teach something this user wants to learn.
  const candidates = await Skill.find({
    userId: { $nin: [toObjectId(userId), ...blockedIds] },
    isDeleted: false,
    isActive: true,
    type: 'teach',
    skillName: { $in: learnSkillNames.map(nameRegex) },
  })
    .populate('userId', 'displayName status isShadowBanned')
    .lean();

  const candidatesWithUser = candidates
    .filter((s) => Boolean(s.userId && typeof s.userId === 'object'))
    .filter((s) => {
      const u = s.userId as unknown as { status: string; isShadowBanned: boolean };
      return u.status === 'active' && !u.isShadowBanned;
    });

  const candidateUserIds = [
    ...new Set(candidatesWithUser.map((s) => String((s.userId as { _id: unknown })._id))),
  ];

  // Do those people also want to learn a skill this user teaches?
  const candidateLearnSkills =
    candidateUserIds.length > 0
      ? await Skill.find({
          userId: { $in: candidateUserIds },
          isDeleted: false,
          type: 'learn',
          skillName: { $in: teachSkillNames.map(nameRegex) },
        }).lean()
      : [];

  const confirmed = new Map<string, { a: string; aTeach: string; b: string; bTeach: string }>();

  for (const candidate of candidatesWithUser) {
    const candidateUserId = String((candidate.userId as { _id: unknown })._id);
    // First teach skill this person offers that I want to learn.
    const otherTeaches = candidate;
    // First reciprocal: my teach skill this person wants to learn.
    const reciprocal = candidateLearnSkills.find(
      (s) => String((s.userId as { _id: unknown })._id || s.userId) === candidateUserId,
    );
    if (!reciprocal) continue;
    const userTeachesSkillId = teachSkillMap.get(reciprocal.skillName.toLowerCase());
    if (!userTeachesSkillId) continue;

    const { a, b } = canonicalPair(userId, candidateUserId);
    const aTeach = a === userId ? userTeachesSkillId : String(otherTeaches._id);
    const bTeach = a === userId ? String(otherTeaches._id) : userTeachesSkillId;
    confirmed.set(pairKey(a, aTeach, b, bTeach), { a, aTeach, b, bTeach });
  }

  for (const { a, aTeach, b, bTeach } of confirmed.values()) {
    await SwapReadyMatch.updateOne(
      { userAId: toObjectId(a), userATeachesSkillId: toObjectId(aTeach), userBId: toObjectId(b), userBTeachesSkillId: toObjectId(bTeach) },
      {
        $setOnInsert: {
          userAId: toObjectId(a),
          userATeachesSkillId: toObjectId(aTeach),
          userBId: toObjectId(b),
          userBTeachesSkillId: toObjectId(bTeach),
          status: 'available',
        },
        $set: { lastMatchDate: new Date() },
      },
      { upsert: true },
    );
  }

  // Remove stale available matches for this user that are no longer confirmed.
  const confirmedKeys = new Set(confirmed.keys());
  const existing = await SwapReadyMatch.find({
    $or: [{ userAId: toObjectId(userId) }, { userBId: toObjectId(userId) }],
    status: 'available',
  }).lean();
  const staleIds = existing
    .filter((m) => {
      const a = String(m.userAId);
      const b = String(m.userBId);
      return !confirmedKeys.has(pairKey(a, String(m.userATeachesSkillId), b, String(m.userBTeachesSkillId)));
    })
    .map((m) => m._id);
  if (staleIds.length) {
    await SwapReadyMatch.deleteMany({ _id: { $in: staleIds }, status: 'available' });
  }
}

/** Recompute the swap-ready matches affected by a newly created or updated skill. */
export async function recomputeMatchesForSkill(skill: Record<string, unknown>): Promise<void> {
  if (!skill?.userId) return;
  await recomputeMatchesForUser(String(skill.userId));
}

export async function getAvailableMatches(userId: string, limit = 50) {
  const blocked = await getBlockedIds(userId);
  const blockedIds = blocked.map((b) => new Types.ObjectId(b));
  const selfId = toObjectId(userId);

  const filter: Record<string, unknown> = { status: 'available' };
  if (blockedIds.length) {
    filter.$or = [
      { userAId: selfId, userBId: { $nin: blockedIds } },
      { userBId: selfId, userAId: { $nin: blockedIds } },
    ];
  } else {
    filter.$or = [{ userAId: selfId }, { userBId: selfId }];
  }

  const matches = await SwapReadyMatch.find(filter)
    .populate(MATCH_POPULATE)
    .sort({ lastMatchDate: -1 })
    .limit(Math.min(100, Math.max(1, limit)))
    .lean();

  // A match whose user or skill no longer exists cannot be shown or acted on.
  return matches
    .filter((m) => {
      const refs = ['userAId', 'userBId', 'userATeachesSkillId', 'userBTeachesSkillId'];
      return refs.every((p) => {
        const v = (m as unknown as Record<string, unknown>)[p];
        return Boolean(v && typeof v === 'object' && (v as { _id?: unknown })._id);
      });
    })
    .map((m) => ({
      ...m,
      userIsA: String((m.userAId as { _id: unknown })._id) === userId,
    }));
}

export async function hideMatch(matchId: string, userId: string) {
  const result = await SwapReadyMatch.updateOne(
    {
      _id: toObjectId(matchId),
      $or: [{ userAId: toObjectId(userId) }, { userBId: toObjectId(userId) }],
      status: 'available',
    },
    { $set: { status: 'hidden' } },
  );
  if (result.modifiedCount === 0) {
    throw new HttpError(404, 'MATCH_NOT_FOUND', 'Swap-ready match not found or no longer available');
  }
  return { success: true };
}

/**
 * Turn an available match into a real skill swap. Creates the SkillSwap through
 * the existing swap flow (validates users, skills, blocks and duplicates) and,
 * only on success, marks the match as `proposed`.
 */
export async function proposeMatch(matchId: string, userId: string) {
  const match = await SwapReadyMatch.findById(toObjectId(matchId));
  if (!match) throw new HttpError(404, 'MATCH_NOT_FOUND', 'Swap-ready match not found');
  if (String(match.userAId) !== userId && String(match.userBId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'You are not part of this match');
  }
  if (match.status !== 'available') {
    throw new HttpError(409, 'MATCH_NOT_AVAILABLE', 'This match is no longer available');
  }

  const swap = await swapService.createSwap(
    String(match.userAId),
    String(match.userBId),
    String(match.userATeachesSkillId),
    String(match.userBTeachesSkillId),
  );

  await SwapReadyMatch.updateOne({ _id: match._id }, { $set: { status: 'proposed' } });
  return { matchId: String(match._id), swap };
}

/** Reflect the outcome of a resolved swap back onto its swap-ready match. */
export async function syncFromSwap(swap: ISkillSwap): Promise<void> {
  await SwapReadyMatch.updateOne(
    {
      userAId: swap.userAId,
      userATeachesSkillId: swap.userATeachesSkillId,
      userBId: swap.userBId,
      userBTeachesSkillId: swap.userBTeachesSkillId,
    },
    { $set: { status: swap.status === 'accepted' ? 'accepted' : 'declined' } },
  );
}
