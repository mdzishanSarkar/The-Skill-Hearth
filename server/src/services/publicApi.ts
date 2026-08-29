import crypto from 'crypto';
import { Types } from 'mongoose';
import { ApiKey, Skill, User, Connection, Review } from '../models';
import { HttpError } from '../utils/errors';
import { escapeRegExp } from '../utils/regex';

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

function generateApiKey(): string {
  return `sk_live_${crypto.randomBytes(32).toString('hex')}`;
}

export interface CreateApiKeyInput {
  ownerId: string;
  name: string;
  scopes?: string[];
  rateLimit?: number;
  expiresAt?: string;
}

export async function createApiKey(input: CreateApiKeyInput) {
  const key = await ApiKey.create({
    ownerId: toObjectId(input.ownerId),
    key: generateApiKey(),
    name: input.name.trim(),
    scopes: input.scopes || ['skills:read'],
    rateLimit: input.rateLimit || 100,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
  });
  return key.toJSON();
}

export async function listApiKeys(ownerId: string) {
  const keys = await ApiKey.find({ ownerId: toObjectId(ownerId) })
    .sort({ createdAt: -1 })
    .lean();
  return keys.map(({ key, ...apiKey }) => ({
    ...apiKey,
    key: `${key.slice(0, 12)}...`,
  }));
}

export async function revokeApiKey(keyId: string, ownerId: string) {
  const key = await ApiKey.findOneAndUpdate(
    { _id: toObjectId(keyId), ownerId: toObjectId(ownerId) },
    { status: 'revoked' },
    { returnDocument: 'after' }
  );
  if (!key) throw new HttpError(404, 'NOT_FOUND', 'API key not found');
  return key.toJSON();
}

export async function validateApiKey(key: string) {
  const apiKey = await ApiKey.findOne({ key, status: 'active' }).lean();
  if (!apiKey) throw new HttpError(401, 'INVALID_KEY', 'Invalid or revoked API key');
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    throw new HttpError(401, 'KEY_EXPIRED', 'API key has expired');
  }
  const updated = await ApiKey.findOneAndUpdate(
    {
      _id: apiKey._id,
      status: 'active',
      requestCount: { $lt: apiKey.rateLimit },
    },
    { $inc: { requestCount: 1 }, $set: { lastUsedAt: new Date() } },
    { returnDocument: 'after' },
  ).lean();
  if (!updated) {
    throw new HttpError(429, 'RATE_LIMITED', 'API rate limit exceeded');
  }
  return updated;
}

export async function querySkills(params: {
  q?: string;
  category?: string;
  city?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { isDeleted: false };
  if (params.q) filter.skillName = { $regex: new RegExp(escapeRegExp(params.q.slice(0, 100)), 'i') };
  if (params.category) filter.categoryName = params.category;
  if (params.city) filter['location.city'] = params.city;

  const [skills, total] = await Promise.all([
    Skill.find(filter)
      .select('skillName categoryName description location stats')
      .skip(skip)
      .limit(limit)
      .lean(),
    Skill.countDocuments(filter),
  ]);

  return { skills, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
}

export async function getPlatformStats() {
  const [totalUsers, totalSkills] = await Promise.all([
    User.countDocuments({ isDeleted: { $ne: true } }),
    Skill.countDocuments({ isDeleted: false }),
  ]);
  const [totalConnections, totalReviews] = await Promise.all([
    Connection.countDocuments({ status: 'completed' }),
    Review.countDocuments({ isDeleted: { $ne: true } }),
  ]);
  return { totalUsers, totalSkills, totalConnections, totalReviews };
}
