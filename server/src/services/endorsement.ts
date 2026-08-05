import { Endorsement, Connection } from '../models';
import { HttpError } from '../utils/errors';

export async function endorseSkill(
  endorserId: string,
  endorseeId: string,
  skillId: string,
  connectionId: string,
) {
  if (endorserId === endorseeId) {
    throw new HttpError(400, 'CANNOT_ENDORSE_SELF', 'You cannot endorse yourself');
  }

  const connection = await Connection.findOne({
    _id: connectionId,
    status: 'completed',
    $or: [
      { requesterId: endorserId, teacherId: endorseeId },
      { requesterId: endorseeId, teacherId: endorserId },
    ],
  });

  if (!connection) {
    throw new HttpError(400, 'NO_COMPLETED_CONNECTION', 'You can only endorse users you have completed a session with');
  }

  const existing = await Endorsement.findOne({
    endorserId,
    endorseeId,
    skillId,
  });

  if (existing) {
    throw new HttpError(409, 'ALREADY_ENDORSED', 'You have already endorsed this skill for this user');
  }

  const endorsement = await Endorsement.create({
    endorserId,
    endorseeId,
    skillId,
    connectionId,
  });

  return endorsement.toJSON();
}

export async function removeEndorsement(endorsementId: string, userId: string) {
  const endorsement = await Endorsement.findById(endorsementId);
  if (!endorsement) {
    throw new HttpError(404, 'NOT_FOUND', 'Endorsement not found');
  }
  if (String(endorsement.endorserId) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'You can only remove your own endorsements');
  }
  await endorsement.deleteOne();
  return { success: true };
}

export async function getSkillEndorsements(skillId: string, page = 1, limit = 20) {
  const skip = (Math.max(1, page) - 1) * Math.min(50, Math.max(1, limit));
  const [endorsements, total] = await Promise.all([
    Endorsement.find({ skillId })
      .populate('endorserId', 'displayName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Endorsement.countDocuments({ skillId }),
  ]);

  return {
    endorsements,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserEndorsements(userId: string) {
  const endorsements = await Endorsement.find({ endorseeId: userId })
    .populate('endorserId', 'displayName avatar')
    .populate('skillId', 'skillName categoryName')
    .sort({ createdAt: -1 })
    .lean();

  const grouped = new Map<string, { skill: unknown; count: number; endorsers: unknown[] }>();
  for (const e of endorsements) {
    const skillId = String((e.skillId as unknown as { _id: string })._id);
    if (!grouped.has(skillId)) {
      grouped.set(skillId, { skill: e.skillId, count: 0, endorsers: [] });
    }
    const group = grouped.get(skillId)!;
    group.count++;
    group.endorsers.push(e.endorserId);
  }

  return Array.from(grouped.values());
}

export async function hasEndorsed(endorserId: string, endorseeId: string, skillId: string): Promise<boolean> {
  const count = await Endorsement.countDocuments({ endorserId, endorseeId, skillId });
  return count > 0;
}
