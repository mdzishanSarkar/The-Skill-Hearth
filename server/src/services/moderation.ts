import { Types } from 'mongoose';
import {
  User,
  Skill,
  Review,
  Message,
  Report,
  AuditLog,
  Connection,
  RefreshToken,
  CommunityPost,
  GroupSession,
  Block,
} from '../models';
import type { IUser } from '../models';
import type { NotificationType } from '../models';
import type { ReportAction } from '../models/Report';
import { HttpError } from '../utils/errors';
import { createNotification } from './notification';

export interface ModerationContext {
  adminId: string;
  reason?: string;
  reportId?: string;
  resolution?: string;
}

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid id');
  }
  return new Types.ObjectId(value);
}

function sanitizeUser(user: IUser): Record<string, unknown> {
  const json = user.toJSON() as Record<string, unknown>;
  delete json.passwordHash;
  return json;
}

export async function logAudit(input: {
  performedBy: Types.ObjectId;
  action: string;
  targetType: 'user' | 'skill' | 'review' | 'message' | 'report' | 'post' | 'connection' | 'category';
  targetId: Types.ObjectId;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  await AuditLog.create(input);
}

async function resolveReportIfProvided(context: ModerationContext, action: ReportAction) {
  if (!context.reportId || !Types.ObjectId.isValid(context.reportId)) return;
  const report = await Report.findById(context.reportId);
  if (!report || report.status === 'resolved' || report.status === 'dismissed') return;
  report.status = 'resolved';
  report.action = action;
  if (context.resolution) report.resolution = context.resolution;
  await report.save();
}

async function notify(userId: Types.ObjectId, type: NotificationType, message: string, reportId?: string) {
  await createNotification({
    userId,
    type,
    message,
    referenceId: reportId && Types.ObjectId.isValid(reportId) ? new Types.ObjectId(reportId) : undefined,
    referenceModel: 'Report',
  });
}

async function revokeSessions(userId: Types.ObjectId) {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

export async function warnUser(userId: string, context: ModerationContext) {
  const id = toObjectId(userId);
  const user = await User.findById(id);
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  if (user.status !== 'active') {
    throw new HttpError(400, 'USER_NOT_ACTIVE', 'Only active accounts can be warned');
  }

  const before = { status: user.status };
  user.status = 'active';
  await user.save();

  await logAudit({
    performedBy: toObjectId(context.adminId),
    action: 'warn',
    targetType: 'user',
    targetId: id,
    before,
    after: { status: user.status },
    metadata: { reason: context.reason },
  });
  await notify(
    id,
    'system_warning',
    `You received a warning from our moderation team${context.reason ? `: ${context.reason}` : '.'}`
  );
  await resolveReportIfProvided(context, 'warn');

  return { user: sanitizeUser(user) };
}

export async function suspendUser(userId: string, durationDays: number, context: ModerationContext) {
  const days = Math.min(30, Math.max(1, Math.round(durationDays || 7)));
  const id = toObjectId(userId);
  const user = await User.findById(id);
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');

  const before = { status: user.status, suspensionExpiresAt: user.suspensionExpiresAt };
  user.status = 'suspended';
  user.suspensionExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await user.save();
  await revokeSessions(id);

  await logAudit({
    performedBy: toObjectId(context.adminId),
    action: 'suspend',
    targetType: 'user',
    targetId: id,
    before,
    after: { status: user.status, suspensionExpiresAt: user.suspensionExpiresAt },
    metadata: { reason: context.reason, durationDays: days },
  });
  await notify(
    id,
    'account_suspended',
    `Your account has been suspended for ${days} day${days === 1 ? '' : 's'}${
      context.reason ? `: ${context.reason}` : '.'
    }`
  );
  await resolveReportIfProvided(context, 'suspend');

  return { user: sanitizeUser(user), durationDays: days };
}

export async function banUser(userId: string, context: ModerationContext) {
  const id = toObjectId(userId);
  const user = await User.findById(id);
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');

  const before = { status: user.status, suspensionExpiresAt: user.suspensionExpiresAt };
  user.status = 'banned';
  user.suspensionExpiresAt = undefined;
  await user.save();
  await revokeSessions(id);

  await logAudit({
    performedBy: toObjectId(context.adminId),
    action: 'ban',
    targetType: 'user',
    targetId: id,
    before,
    after: { status: user.status },
    metadata: { reason: context.reason },
  });
  await notify(id, 'account_banned', 'Your account has been permanently banned.');
  await resolveReportIfProvided(context, 'ban');

  return { user: sanitizeUser(user) };
}

export async function reactivateUser(userId: string, adminId: string) {
  const id = toObjectId(userId);
  const user = await User.findById(id);
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');

  const before = { status: user.status };
  user.status = 'active';
  user.suspensionExpiresAt = undefined;
  await user.save();

  await logAudit({
    performedBy: toObjectId(adminId),
    action: 'reactivate',
    targetType: 'user',
    targetId: id,
    before,
    after: { status: user.status },
  });
  await notify(id, 'account_suspended', 'Your account has been reactivated.');

  return { user: sanitizeUser(user) };
}

export async function removeSkill(skillId: string, context: ModerationContext) {
  const id = toObjectId(skillId);
  const skill = await Skill.findById(id);
  if (!skill) throw new HttpError(404, 'SKILL_NOT_FOUND', 'Skill not found');

  const before = { isDeleted: skill.isDeleted, isActive: skill.isActive };
  skill.isDeleted = true;
  skill.isActive = false;
  skill.deletedAt = new Date();
  await skill.save();

  await logAudit({
    performedBy: toObjectId(context.adminId),
    action: 'remove',
    targetType: 'skill',
    targetId: id,
    before,
    after: { isDeleted: skill.isDeleted },
    metadata: { reason: context.reason },
  });
  await notify(
    skill.userId,
    'skill_removed',
    `Your listing "${skill.skillName}" was removed for violating our guidelines.`
  );
  await resolveReportIfProvided(context, 'remove_content');

  return { skillId: id.toString() };
}

async function recalculateSkillRating(skillId: Types.ObjectId) {
  const [result] = await Review.aggregate<{ avg: number | null; count: number }>([
    { $match: { skillId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Skill.updateOne(
    { _id: skillId },
    {
      $set: {
        'stats.averageRating': result?.avg ?? 0,
        'stats.reviewCount': result?.count ?? 0,
      },
    }
  );
}

async function recalculateUserRating(userId: Types.ObjectId) {
  const [result] = await Review.aggregate<{ avg: number | null; count: number }>([
    { $match: { revieweeId: userId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        'stats.averageRating': result?.avg ?? 0,
        'stats.reviewCount': result?.count ?? 0,
      },
    }
  );
}

export async function removeReview(reviewId: string, context: ModerationContext) {
  const id = toObjectId(reviewId);
  const review = await Review.findById(id);
  if (!review) throw new HttpError(404, 'REVIEW_NOT_FOUND', 'Review not found');

  const { revieweeId, skillId } = review;
  await review.deleteOne();

  await logAudit({
    performedBy: toObjectId(context.adminId),
    action: 'remove',
    targetType: 'review',
    targetId: id,
    metadata: { reason: context.reason },
  });
  await notify(
    revieweeId,
    'review_received',
    'A review on your profile was removed for violating our guidelines.'
  );
  await resolveReportIfProvided(context, 'remove_content');

  await Promise.all([recalculateUserRating(revieweeId), recalculateSkillRating(skillId)]);

  return { reviewId: id.toString() };
}

export async function deleteMessage(messageId: string, context: ModerationContext) {
  const id = toObjectId(messageId);
  const message = await Message.findById(id);
  if (!message) throw new HttpError(404, 'MESSAGE_NOT_FOUND', 'Message not found');

  message.isDeleted = true;
  await message.save();

  await logAudit({
    performedBy: toObjectId(context.adminId),
    action: 'remove',
    targetType: 'message',
    targetId: id,
    metadata: { reason: context.reason },
  });
  await resolveReportIfProvided(context, 'remove_content');

  return { messageId: id.toString() };
}

export async function getModerationStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [users, skills, sessions, reportsThisWeek, openReports, suspended, banned, shadowBanned] =
    await Promise.all([
      User.countDocuments(),
      Skill.countDocuments({ isDeleted: false }),
      Connection.countDocuments({ status: { $in: ['accepted', 'completed'] } }),
      Report.countDocuments({ createdAt: { $gte: weekAgo } }),
      Report.countDocuments({ status: 'open' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ status: 'banned' }),
      User.countDocuments({ isShadowBanned: true }),
    ]);

  return {
    totalUsers: users,
    totalSkills: skills,
    totalSessions: sessions,
    reportsThisWeek,
    openReports,
    suspendedUsers: suspended,
    bannedUsers: banned,
    shadowBannedUsers: shadowBanned,
  };
}

export async function shadowBanUser(userId: string, context: ModerationContext) {
  const id = toObjectId(userId);
  const user = await User.findById(id);
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  if (user.role === 'admin') {
    throw new HttpError(400, 'CANNOT_SHADOW_BAN_ADMIN', 'Cannot shadow ban an admin');
  }

  const before = { isShadowBanned: user.isShadowBanned };
  user.isShadowBanned = true;
  await user.save();

  await logAudit({
    performedBy: toObjectId(context.adminId),
    action: 'shadow_ban',
    targetType: 'user',
    targetId: id,
    before,
    after: { isShadowBanned: true },
    metadata: { reason: context.reason },
  });

  return { user: sanitizeUser(user) };
}

export async function removeShadowBan(userId: string, context: ModerationContext) {
  const id = toObjectId(userId);
  const user = await User.findById(id);
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');

  const before = { isShadowBanned: user.isShadowBanned };
  user.isShadowBanned = false;
  await user.save();

  await logAudit({
    performedBy: toObjectId(context.adminId),
    action: 'remove_shadow_ban',
    targetType: 'user',
    targetId: id,
    before,
    after: { isShadowBanned: false },
    metadata: { reason: context.reason },
  });

  return { user: sanitizeUser(user) };
}

export async function removePost(postId: string, context: ModerationContext) {
  const id = toObjectId(postId);
  const post = await CommunityPost.findById(id);
  if (!post) throw new HttpError(404, 'POST_NOT_FOUND', 'Post not found');

  const before = { isDeleted: post.isDeleted };
  post.isDeleted = true;
  await post.save();

  await logAudit({
    performedBy: toObjectId(context.adminId),
    action: 'remove',
    targetType: 'post',
    targetId: id,
    before,
    after: { isDeleted: true },
    metadata: { reason: context.reason },
  });
  await resolveReportIfProvided(context, 'remove_content');

  return { postId: id.toString() };
}

export interface SuspiciousActivityResult {
  userId: string;
  displayName: string;
  email: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
}

export async function detectSuspiciousActivity(): Promise<SuspiciousActivityResult[]> {
  const flagged: SuspiciousActivityResult[] = [];
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const recentAccounts = await User.find({
    createdAt: { $gte: oneDayAgo },
    status: 'active',
    role: 'user',
  }).select('displayName email createdAt');

  for (const account of recentAccounts) {
    const requestCount = await Connection.countDocuments({
      requesterId: account._id,
      createdAt: { $gte: account.createdAt },
    });

    if (requestCount >= 10) {
      flagged.push({
        userId: String(account._id),
        displayName: account.displayName,
        email: account.email,
        reason: `Sent ${requestCount} requests within 24 hours of account creation`,
        severity: requestCount >= 20 ? 'high' : 'medium',
        detectedAt: now,
      });
    }
  }

  const usersWithMultipleReports = await Report.aggregate([
    {
      $match: {
        createdAt: { $gte: twoDaysAgo },
        targetType: 'user',
      },
    },
    {
      $group: {
        _id: '$targetId',
        reportCount: { $sum: 1 },
        reasons: { $push: '$reason' },
      },
    },
    {
      $match: { reportCount: { $gte: 3 } },
    },
  ]);

  for (const item of usersWithMultipleReports) {
    const user = await User.findById(item._id).select('displayName email status');
    if (!user || user.status !== 'active') continue;

    flagged.push({
      userId: String(item._id),
      displayName: user.displayName,
      email: user.email,
      reason: `Received ${item.reportCount} reports in 48 hours (reasons: ${[...new Set(item.reasons)].join(', ')})`,
      severity: item.reportCount >= 5 ? 'high' : 'medium',
      detectedAt: now,
    });
  }

  return flagged;
}
