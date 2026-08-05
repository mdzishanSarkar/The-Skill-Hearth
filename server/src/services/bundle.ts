import { SkillBundle, Skill } from '../models';
import { HttpError } from '../utils/errors';

export async function createBundle(
  userId: string,
  name: string,
  description: string,
  skillIds: string[],
) {
  if (!name.trim()) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Bundle name is required');
  }
  if (skillIds.length < 2 || skillIds.length > 10) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'A bundle must contain between 2 and 10 skills');
  }

  const skills = await Skill.find({
    _id: { $in: skillIds },
    isDeleted: false,
    isActive: true,
  }).lean();

  if (skills.length !== skillIds.length) {
    throw new HttpError(400, 'INVALID_SKILLS', 'One or more skills are invalid');
  }

  const bundle = await SkillBundle.create({
    name: name.trim(),
    description: description.trim().slice(0, 500),
    skillIds: skills.map((s) => s._id),
    createdBy: userId,
    isOfficial: false,
    votes: 1,
    votedBy: [userId],
  });

  return bundle.toJSON();
}

export async function listBundles(page = 1, limit = 20, sort: 'newest' | 'popular' = 'popular') {
  const skip = (Math.max(1, page) - 1) * Math.min(50, Math.max(1, limit));

  const [bundles, total] = await Promise.all([
    SkillBundle.find()
      .populate('skillIds', 'skillName categoryName')
      .populate('createdBy', 'displayName')
      .sort(sort === 'popular' ? [['votes', -1], ['createdAt', -1]] : [['createdAt', -1]])
      .skip(skip)
      .limit(limit)
      .lean(),
    SkillBundle.countDocuments(),
  ]);

  return { bundles, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getBundle(bundleId: string) {
  const bundle = await SkillBundle.findById(bundleId)
    .populate('skillIds', 'skillName categoryName description proficiencyLevel')
    .populate('createdBy', 'displayName avatar')
    .lean();

  if (!bundle) {
    throw new HttpError(404, 'NOT_FOUND', 'Bundle not found');
  }

  return bundle;
}

export async function voteOnBundle(bundleId: string, userId: string) {
  const bundle = await SkillBundle.findById(bundleId);
  if (!bundle) {
    throw new HttpError(404, 'NOT_FOUND', 'Bundle not found');
  }

  const hasVoted = bundle.votedBy.some((id) => String(id) === userId);
  if (hasVoted) {
    bundle.votedBy = bundle.votedBy.filter((id) => String(id) !== userId);
    bundle.votes = Math.max(0, bundle.votes - 1);
  } else {
    bundle.votedBy.push(userId as never);
    bundle.votes += 1;
  }

  await bundle.save();
  return { votes: bundle.votes, hasVoted: !hasVoted };
}

export async function deleteBundle(bundleId: string, userId: string) {
  const bundle = await SkillBundle.findById(bundleId);
  if (!bundle) {
    throw new HttpError(404, 'NOT_FOUND', 'Bundle not found');
  }
  if (String(bundle.createdBy) !== userId) {
    throw new HttpError(403, 'FORBIDDEN', 'You can only delete your own bundles');
  }
  await bundle.deleteOne();
  return { success: true };
}
