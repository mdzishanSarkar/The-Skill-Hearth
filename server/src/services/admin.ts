import { User } from '../models';
import type { IUser } from '../models';
import mongoose from 'mongoose';
import { HttpError } from '../utils/errors';

const VALID_ROLES = ['user', 'admin', 'moderator'] as const;
const VALID_STATUSES = ['active', 'suspended', 'banned'] as const;

export interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeUser(user: IUser): Record<string, unknown> {
  const json = user.toJSON() as Record<string, unknown>;
  delete json.passwordHash;
  return json;
}

export async function listUsers(query: ListUsersQuery) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const filter: Record<string, unknown> = {};

  if (query.search && query.search.trim()) {
    const regex = new RegExp(escapeRegExp(query.search.trim()), 'i');
    filter.$or = [{ email: regex }, { displayName: regex }];
  }
  if (query.role && (VALID_ROLES as readonly string[]).includes(query.role)) {
    filter.role = query.role;
  }
  if (query.status && (VALID_STATUSES as readonly string[]).includes(query.status)) {
    filter.status = query.status;
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash +identityVerification +identityVerification.documentPath')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getUserDetail(userId: string) {
  const user = await User.findById(userId)
    .select('-passwordHash +identityVerification +identityVerification.documentPath')
    .lean();
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return user;
}

export async function reviewIdentity(
  userId: string,
  reviewerId: string,
  decision: 'verified' | 'rejected',
  rejectionReason?: string
) {
  if (!['verified', 'rejected'].includes(decision)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid identity review decision');
  }
  if (decision === 'rejected' && !rejectionReason?.trim()) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'A reason is required when rejecting identity verification');
  }

  const user = await User.findById(userId).select('+identityVerification +identityVerification.documentPath');
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }
  if (!user.identityVerification) {
    throw new HttpError(400, 'IDENTITY_NOT_SUBMITTED', 'This user has not submitted an identity document');
  }

  user.verificationStatus = decision;
  user.identityVerification.reviewedAt = new Date();
  user.identityVerification.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
  user.identityVerification.rejectionReason = decision === 'rejected' ? rejectionReason!.trim() : undefined;
  await user.save();

  return sanitizeUser(user);
}

export async function getIdentityDocumentPath(userId: string) {
  const user = await User.findById(userId).select('+identityVerification +identityVerification.documentPath').lean();
  if (!user?.identityVerification?.documentPath) {
    throw new HttpError(404, 'IDENTITY_DOCUMENT_NOT_FOUND', 'Identity document not found');
  }
  return user.identityVerification.documentPath;
}

export async function updateUserStatus(
  userId: string,
  status: string,
  suspensionExpiresAt?: string
) {
  if (!(VALID_STATUSES as readonly string[]).includes(status)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid status');
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  user.status = status as IUser['status'];
  user.suspensionExpiresAt =
    status === 'suspended' && suspensionExpiresAt
      ? new Date(suspensionExpiresAt)
      : undefined;
  await user.save();

  return sanitizeUser(user);
}

export async function updateUserRole(userId: string, role: string) {
  if (!(VALID_ROLES as readonly string[]).includes(role)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid role');
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  user.role = role as IUser['role'];
  await user.save();

  return sanitizeUser(user);
}
