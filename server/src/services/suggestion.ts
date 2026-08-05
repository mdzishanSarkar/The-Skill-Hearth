import { SkillSuggestion, User } from '../models';
import { HttpError } from '../utils/errors';
import { Types } from 'mongoose';

export async function submitSuggestion(
  userId: string,
  skillName: string,
  categoryName: string,
  description: string,
) {
  const trimmedName = skillName.trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Skill name must be between 2 and 100 characters');
  }
  if (!categoryName.trim()) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Category name is required');
  }

  const existing = await SkillSuggestion.findOne({
    skillName: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    status: { $ne: 'rejected' },
  });

  if (existing) {
    throw new HttpError(409, 'ALREADY_SUGGESTED', 'A similar skill has already been suggested');
  }

  const suggestion = await SkillSuggestion.create({
    userId,
    skillName: trimmedName,
    categoryName: categoryName.trim(),
    description: description.trim().slice(0, 500),
    votes: 1,
    votedBy: [userId],
  });

  return suggestion.toJSON();
}

export async function voteOnSuggestion(suggestionId: string, userId: string) {
  const suggestion = await SkillSuggestion.findById(suggestionId);
  if (!suggestion) {
    throw new HttpError(404, 'NOT_FOUND', 'Suggestion not found');
  }
  if (suggestion.status !== 'pending') {
    throw new HttpError(400, 'NOT_PENDING', 'Can only vote on pending suggestions');
  }

  const hasVoted = suggestion.votedBy.some((id) => String(id) === userId);
  if (hasVoted) {
    suggestion.votedBy = suggestion.votedBy.filter((id) => String(id) !== userId) as Types.ObjectId[];
    suggestion.votes = Math.max(0, suggestion.votes - 1);
  } else {
    suggestion.votedBy.push(userId as never);
    suggestion.votes += 1;
  }

  await suggestion.save();
  return { votes: suggestion.votes, hasVoted: !hasVoted };
}

export async function listPendingSuggestions(page = 1, limit = 20) {
  const skip = (Math.max(1, page) - 1) * Math.min(50, Math.max(1, limit));
  const [suggestions, total] = await Promise.all([
    SkillSuggestion.find({ status: 'pending' })
      .populate('userId', 'displayName avatar')
      .sort({ votes: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SkillSuggestion.countDocuments({ status: 'pending' }),
  ]);

  return { suggestions, total, page, totalPages: Math.ceil(total / limit) };
}

export async function listAllSuggestions(
  page = 1,
  limit = 20,
  status?: string,
) {
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const skip = (Math.max(1, page) - 1) * Math.min(50, Math.max(1, limit));
  const [suggestions, total] = await Promise.all([
    SkillSuggestion.find(filter)
      .populate('userId', 'displayName avatar')
      .populate('reviewedBy', 'displayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SkillSuggestion.countDocuments(filter),
  ]);

  return { suggestions, total, page, totalPages: Math.ceil(total / limit) };
}

export async function approveSuggestion(suggestionId: string, adminId: string, adminNotes?: string) {
  const suggestion = await SkillSuggestion.findById(suggestionId);
  if (!suggestion) {
    throw new HttpError(404, 'NOT_FOUND', 'Suggestion not found');
  }
  if (suggestion.status !== 'pending') {
    throw new HttpError(400, 'NOT_PENDING', 'Suggestion is not pending');
  }

  suggestion.status = 'approved';
  suggestion.reviewedBy = adminId as never;
  suggestion.reviewedAt = new Date();
  if (adminNotes) suggestion.adminNotes = adminNotes;
  await suggestion.save();

  return suggestion.toJSON();
}

export async function rejectSuggestion(suggestionId: string, adminId: string, adminNotes?: string) {
  const suggestion = await SkillSuggestion.findById(suggestionId);
  if (!suggestion) {
    throw new HttpError(404, 'NOT_FOUND', 'Suggestion not found');
  }
  if (suggestion.status !== 'pending') {
    throw new HttpError(400, 'NOT_PENDING', 'Suggestion is not pending');
  }

  suggestion.status = 'rejected';
  suggestion.reviewedBy = adminId as never;
  suggestion.reviewedAt = new Date();
  if (adminNotes) suggestion.adminNotes = adminNotes;
  await suggestion.save();

  return suggestion.toJSON();
}
