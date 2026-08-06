import { Types } from 'mongoose';
import { Challenge, User, Notification, Connection } from '../models';
import { HttpError } from '../utils/errors';

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

export interface CreateChallengeInput {
  creatorId: string;
  title: string;
  description?: string;
  skillCategory: string;
  challengeType: 'teach' | 'learn' | 'both';
  goalDescription: string;
  goalTarget: number;
  startDate: string;
  endDate: string;
  badgeName: string;
  badgeIcon?: string;
  maxParticipants?: number;
}

export async function createChallenge(input: CreateChallengeInput) {
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  if (end <= start) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'End date must be after start date');
  }

  const challenge = await Challenge.create({
    creatorId: toObjectId(input.creatorId),
    title: input.title.trim(),
    description: input.description?.trim() || '',
    skillCategory: input.skillCategory.trim(),
    challengeType: input.challengeType,
    goalDescription: input.goalDescription.trim(),
    goalTarget: input.goalTarget,
    startDate: start,
    endDate: end,
    status: start > new Date() ? 'upcoming' : 'active',
    badgeName: input.badgeName.trim(),
    badgeIcon: input.badgeIcon || '🏆',
    maxParticipants: input.maxParticipants,
  });

  return challenge.toJSON();
}

export async function listChallenges(query: {
  status?: string;
  skillCategory?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.skillCategory) filter.skillCategory = query.skillCategory;

  const [challenges, total] = await Promise.all([
    Challenge.find(filter)
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creatorId', 'displayName avatar')
      .lean(),
    Challenge.countDocuments(filter),
  ]);

  return { challenges, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

export async function getChallenge(challengeId: string) {
  const challenge = await Challenge.findOne({ _id: toObjectId(challengeId) })
    .populate('creatorId', 'displayName avatar')
    .populate('participants.userId', 'displayName avatar')
    .lean();
  if (!challenge) throw new HttpError(404, 'CHALLENGE_NOT_FOUND', 'Challenge not found');
  return challenge;
}

export async function joinChallenge(challengeId: string, userId: string) {
  const challenge = await Challenge.findById(toObjectId(challengeId));
  if (!challenge) throw new HttpError(404, 'CHALLENGE_NOT_FOUND', 'Challenge not found');

  if (challenge.status === 'completed' || challenge.status === 'cancelled') {
    throw new HttpError(400, 'CHALLENGE_ENDED', 'This challenge has ended');
  }
  if (challenge.maxParticipants && challenge.participants.length >= challenge.maxParticipants) {
    throw new HttpError(400, 'CHALLENGE_FULL', 'Challenge is full');
  }
  if (challenge.participants.some((p) => String(p.userId) === userId)) {
    throw new HttpError(409, 'ALREADY_JOINED', 'You have already joined this challenge');
  }

  challenge.participants.push({
    userId: toObjectId(userId),
    joinedAt: new Date(),
    progress: 0,
  });
  await challenge.save();

  return challenge.toJSON();
}

export async function updateProgress(challengeId: string, userId: string, progress: number) {
  const challenge = await Challenge.findById(toObjectId(challengeId));
  if (!challenge) throw new HttpError(404, 'CHALLENGE_NOT_FOUND', 'Challenge not found');

  const participant = challenge.participants.find(
    (p) => String(p.userId) === userId
  );
  if (!participant) {
    throw new HttpError(403, 'NOT_PARTICIPANT', 'You are not a participant in this challenge');
  }

  participant.progress = Math.min(challenge.goalTarget, Math.max(0, progress));
  if (participant.progress >= challenge.goalTarget && !participant.completedAt) {
    participant.completedAt = new Date();
  }

  await challenge.save();
  return challenge.toJSON();
}

export async function getLeaderboard(challengeId: string) {
  const challenge = await Challenge.findOne({ _id: toObjectId(challengeId) })
    .populate('participants.userId', 'displayName avatar')
    .lean();
  if (!challenge) throw new HttpError(404, 'CHALLENGE_NOT_FOUND', 'Challenge not found');

  const sorted = [...challenge.participants].sort((a, b) => {
    if (a.completedAt && !b.completedAt) return -1;
    if (!a.completedAt && b.completedAt) return 1;
    if (a.completedAt && b.completedAt) {
      return a.completedAt.getTime() - b.completedAt.getTime();
    }
    return b.progress - a.progress;
  });

  return sorted.map((p, i) => ({
    rank: i + 1,
    user: p.userId,
    progress: p.progress,
    completedAt: p.completedAt,
    joinedAt: p.joinedAt,
  }));
}
