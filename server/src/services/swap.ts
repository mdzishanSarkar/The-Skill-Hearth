import { SkillSwap, Skill, User } from '../models';
import { HttpError } from '../utils/errors';

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

  const teachSkillIds = teachSkills.map((s) => s._id);
  const learnSkillNames = learnSkills.map((s) => s.skillName.toLowerCase());

  const candidates = await Skill.find({
    userId: { $ne: userId },
    isDeleted: false,
    isActive: true,
    type: 'teach',
    skillName: { $in: learnSkillNames },
  }).populate('userId', 'displayName avatar status').lean();

  const candidateUserIds = [...new Set(candidates.map((s) => String(s.userId._id || s.userId)))];

  const candidateLearnSkills = await Skill.find({
    userId: { $in: candidateUserIds },
    isDeleted: false,
    isActive: true,
    type: 'teach',
    skillId: { $in: teachSkillIds },
  }).lean();

  const teachSkillMap = new Map<string, string>();
  for (const s of teachSkills) {
    teachSkillMap.set(s.skillName.toLowerCase(), String(s._id));
  }

  const suggestions: Array<{
    otherUser: unknown;
    userTeachesSkill: unknown;
    otherTeachesSkill: unknown;
    matchScore: number;
  }> = [];

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

  for (const candidate of candidates) {
    const candidateUserId = String(candidate.userId._id || candidate.userId);
    const a = userId < candidateUserId ? userId : candidateUserId;
    const b = userId < candidateUserId ? candidateUserId : userId;
    const key = `${a}:${b}`;

    if (seen.has(key) || existingSwapKeys.has(key)) continue;
    seen.add(key);

    const learnSkillId = teachSkillMap.get(candidate.skillName.toLowerCase());
    if (!learnSkillId) continue;

    const otherTeachSkill = candidateLearnSkills.find(
      (s) => String(s.userId._id || s.userId) === candidateUserId,
    );

    if (!otherTeachSkill) continue;

    suggestions.push({
      otherUser: candidate.userId,
      userTeachesSkill: { skillId: learnSkillId, skillName: candidate.skillName },
      otherTeachesSkill: { skillId: String(otherTeachSkill._id), skillName: otherTeachSkill.skillName },
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

  const [skillA, skillB] = await Promise.all([
    Skill.findOne({ _id: userATeachesSkillId, userId: userAId, isDeleted: false }),
    Skill.findOne({ _id: userBTeachesSkillId, userId: userBId, isDeleted: false }),
  ]);

  if (!skillA || !skillB) {
    throw new HttpError(400, 'INVALID_SKILLS', 'One or both skills are invalid');
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

  const swap = await SkillSwap.create({
    userAId: a,
    userBId: b,
    userATeachesSkillId: userAId === a ? userATeachesSkillId : userBTeachesSkillId,
    userBTeachesSkillId: userAId === a ? userBTeachesSkillId : userATeachesSkillId,
    status: 'suggested',
  });

  return swap.toJSON();
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
  return swap.toJSON();
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
  swap.declinedBy = userId as never;
  await swap.save();
  return swap.toJSON();
}

export async function listUserSwaps(userId: string, status?: string) {
  const filter: Record<string, unknown> = {
    $or: [{ userAId: userId }, { userBId: userId }],
  };
  if (status) filter.status = status;

  const swaps = await SkillSwap.find(filter)
    .populate('userAId', 'displayName avatar')
    .populate('userBId', 'displayName avatar')
    .populate('userATeachesSkillId', 'skillName categoryName')
    .populate('userBTeachesSkillId', 'skillName categoryName')
    .sort({ createdAt: -1 })
    .lean();

  return swaps;
}
