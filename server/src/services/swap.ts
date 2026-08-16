import { SkillSwap, Skill, User } from '../models';
import { getBlockedIds, isBlocked } from './block.service';
import { HttpError } from '../utils/errors';
import { syncFromSwap } from './swapReadyMatch.service';

function nameRegex(name: string): RegExp {
  return new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

export async function findSwapSuggestions(userId: string, limit = 20) {
  const userSkills = await Skill.find({
    userId,
    isDeleted: false,
    isActive: true,
  }).lean();

  const teachSkills = userSkills.filter((s) => s.type === 'teach');
  const learnSkills = userSkills.filter((s) => s.type === 'learn');

  if (teachSkills.length === 0 || learnSkills.length === 0) {
    return [];
  }

  const teachSkillMap = new Map<string, string>();
  for (const s of teachSkills) {
    teachSkillMap.set(s.skillName.toLowerCase(), String(s._id));
  }

  const learnSkillNames = learnSkills.map((s) => s.skillName.toLowerCase());

  // Never suggest users the current user blocked, or who blocked the current user.
  const blockedIds = await getBlockedIds(userId);

  // People who teach a skill the current user wants to learn.
  const candidates = await Skill.find({
    userId: { $nin: [userId, ...blockedIds] },
    isDeleted: false,
    isActive: true,
    type: 'teach',
    skillName: { $in: learnSkillNames.map(nameRegex) },
  })
    .populate('userId', 'displayName avatar status isShadowBanned')
    .lean();

  const candidatesWithUser = candidates
    .filter((s) => Boolean(s.userId && typeof s.userId === 'object'))
    .map((s) => ({
      _id: s._id,
      skillName: s.skillName,
      userId: s.userId as unknown as {
        _id: string;
        displayName: string;
        avatar: string;
        status: string;
        isShadowBanned: boolean;
      },
    }))
    .filter((s) => s.userId.status === 'active' && !s.userId.isShadowBanned);

  const candidateUserIds = [...new Set(candidatesWithUser.map((s) => String(s.userId._id)))];

  // Reciprocity check: do those people also want to learn a skill the current user teaches?
  const candidateLearnSkills = await Skill.find({
    userId: { $in: candidateUserIds },
    isDeleted: false,
    type: 'learn',
    skillName: { $in: [...teachSkillMap.keys()].map(nameRegex) },
  }).lean();

  const existingSwaps = await SkillSwap.find({
    $or: [{ userAId: userId }, { userBId: userId }],
    status: { $ne: 'declined' },
  }).lean();

  const existingSwapKeys = new Set(
    existingSwaps.map((s) => {
      const a = String(s.userAId);
      const b = String(s.userBId);
      return [a < b ? a : b, a < b ? b : a].join(':');
    }),
  );

  const seen = new Set<string>();

  const suggestions: Array<{
    otherUser: unknown;
    userTeachesSkill: unknown;
    otherTeachesSkill: unknown;
    matchScore: number;
  }> = [];

  for (const candidate of candidatesWithUser) {
    const candidateUserId = String(candidate.userId._id);
    const a = userId < candidateUserId ? userId : candidateUserId;
    const b = userId < candidateUserId ? candidateUserId : userId;
    const key = `${a}:${b}`;

    if (seen.has(key) || existingSwapKeys.has(key)) continue;
    seen.add(key);

    // The skill this person teaches, which I want to learn.
    const otherTeachesSkill = {
      skillId: String(candidate._id),
      skillName: candidate.skillName,
    };

    // My teach skill that this person wants to learn.
    const reciprocal = candidateLearnSkills.find(
      (s) => String(s.userId._id || s.userId) === candidateUserId,
    );
    if (!reciprocal) continue;

    const userTeachesSkillId = teachSkillMap.get(reciprocal.skillName.toLowerCase());
    if (!userTeachesSkillId) continue;

    suggestions.push({
      otherUser: candidate.userId,
      userTeachesSkill: { skillId: userTeachesSkillId, skillName: reciprocal.skillName },
      otherTeachesSkill,
      matchScore: 1,
    });
  }

  return suggestions.slice(0, limit);
}

export async function createSwap(
  userAId: string,
  userBId: string,
  userATeachesSkillId: string,
  userBTeachesSkillId: string,
) {
  if (userAId === userBId) {
    throw new HttpError(400, 'INVALID_SWAP', 'Cannot create swap with yourself');
  }

  if (await isBlocked(userAId, userBId)) {
    throw new HttpError(403, 'BLOCKED', 'You cannot create a swap with this user');
  }

  const [skillA, skillB] = await Promise.all([
    Skill.findOne({ _id: userATeachesSkillId, userId: userAId, type: 'teach', isDeleted: false }),
    Skill.findOne({ _id: userBTeachesSkillId, userId: userBId, type: 'teach', isDeleted: false }),
  ]);

  if (!skillA || !skillB) {
    throw new HttpError(400, 'INVALID_SKILLS', 'One or both skills are invalid');
  }

  const [userA, userB] = await Promise.all([
    User.findById(userAId).select('status isShadowBanned'),
    User.findById(userBId).select('status isShadowBanned'),
  ]);

  for (const user of [userA, userB]) {
    if (!user || user.status !== 'active' || user.isShadowBanned) {
      throw new HttpError(400, 'INVALID_USER', 'One of the users is not available');
    }
  }

  const a = userAId < userBId ? userAId : userBId;
  const b = userAId < userBId ? userBId : userAId;

  const existing = await SkillSwap.findOne({
    userAId: a,
    userBId: b,
    status: { $ne: 'declined' },
  });

  if (existing) {
    throw new HttpError(409, 'SWAP_EXISTS', 'A swap between you and this user already exists');
  }

  let swap: InstanceType<typeof SkillSwap>;
  try {
    swap = await SkillSwap.create({
      userAId: a,
      userBId: b,
      userATeachesSkillId: userAId === a ? userATeachesSkillId : userBTeachesSkillId,
      userBTeachesSkillId: userAId === a ? userBTeachesSkillId : userATeachesSkillId,
      status: 'suggested',
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw new HttpError(409, 'SWAP_EXISTS', 'A swap between you and this user already exists');
    }
    throw err;
  }

  return populatedSwap(String(swap._id));
}

export async function acceptSwap(swapId: string, userId: string) {
  const swap = await SkillSwap.findById(swapId);
  if (!swap) {
    throw new HttpError(404, 'NOT_FOUND', 'Swap not found');
  }
  if (String(swap.userAId) !== userId && String(swap.userBId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'You are not part of this swap');
  }
  if (swap.status !== 'suggested') {
    throw new HttpError(400, 'INVALID_STATUS', 'Swap is not in suggested status');
  }

  swap.status = 'accepted';
  await swap.save();
  void syncFromSwap(swap).catch(() => {});
  return populatedSwap(swapId);
}

export async function declineSwap(swapId: string, userId: string) {
  const swap = await SkillSwap.findById(swapId);
  if (!swap) {
    throw new HttpError(404, 'NOT_FOUND', 'Swap not found');
  }
  if (String(swap.userAId) !== userId && String(swap.userBId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'You are not part of this swap');
  }

  swap.status = 'declined';
  swap.set('declinedBy', userId);
  await swap.save();
  void syncFromSwap(swap).catch(() => {});
  return populatedSwap(swapId);
}

const SWAP_POPULATE = [
  { path: 'userAId', select: 'displayName avatar' },
  { path: 'userBId', select: 'displayName avatar' },
  { path: 'userATeachesSkillId', select: 'skillName categoryName' },
  { path: 'userBTeachesSkillId', select: 'skillName categoryName' },
];

async function populatedSwap(swapId: string) {
  return SkillSwap.findById(swapId).populate(SWAP_POPULATE).lean();
}

export async function listUserSwaps(userId: string, status?: string) {
  const filter: Record<string, unknown> = {
    $or: [{ userAId: userId }, { userBId: userId }],
  };
  if (status) filter.status = status;

  const swaps = await SkillSwap.find(filter)
    .populate(SWAP_POPULATE)
    .sort({ createdAt: -1 })
    .lean();

  // A swap whose user or skill no longer exists cannot be shown or acted on.
  return swaps.filter((s) => {
    const refs = ['userAId', 'userBId', 'userATeachesSkillId', 'userBTeachesSkillId'];
    return refs.every((p) => {
      const v = (s as unknown as Record<string, unknown>)[p];
      return Boolean(v && typeof v === 'object' && (v as { _id?: unknown })._id);
    });
  });
}
