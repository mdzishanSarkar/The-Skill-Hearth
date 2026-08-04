import { Types } from 'mongoose';
import {
  Report,
  User,
  Skill,
  Review,
  Message,
  CommunityPost,
  Connection,
} from '../models';
import type { ReportAction, ReportReason, ReportStatus, ReportTargetType } from '../models/Report';
import { HttpError } from '../utils/errors';

const REASONS_BY_TARGET: Record<ReportTargetType, ReportReason[]> = {
  user: ['harassment', 'inappropriate', 'spam', 'fake', 'other'],
  skill: ['misleading', 'fake', 'spam', 'inappropriate', 'other'],
  message: ['harassment', 'inappropriate', 'spam', 'other'],
  review: ['fake', 'harassment', 'inappropriate', 'spam', 'other'],
  post: ['harassment', 'inappropriate', 'spam', 'other'],
};

const STATUS_PRIORITY: Record<ReportStatus, number> = {
  open: 0,
  under_review: 1,
  resolved: 2,
  dismissed: 3,
};

export interface SubmitReportInput {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
}

function toObjectId(value: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid target id');
  }
  return new Types.ObjectId(value);
}

async function assertTargetAllowed(
  targetType: ReportTargetType,
  targetId: string,
  reporterId: string
): Promise<{ ownerId?: string; connectionId?: Types.ObjectId }> {
  const id = toObjectId(targetId);

  switch (targetType) {
    case 'user': {
      const target = await User.findById(id);
      if (!target) throw new HttpError(404, 'TARGET_NOT_FOUND', 'Reported user not found');
      if (target._id.toString() === reporterId) {
        throw new HttpError(400, 'CANNOT_REPORT_SELF', 'You cannot report yourself');
      }
      return { ownerId: target._id.toString() };
    }
    case 'skill': {
      const target = await Skill.findById(id);
      if (!target || target.isDeleted) {
        throw new HttpError(404, 'TARGET_NOT_FOUND', 'Reported skill not found');
      }
      if (target.userId.toString() === reporterId) {
        throw new HttpError(400, 'CANNOT_REPORT_OWN', 'You cannot report your own listing');
      }
      return { ownerId: target.userId.toString() };
    }
    case 'review': {
      const target = await Review.findById(id);
      if (!target) throw new HttpError(404, 'TARGET_NOT_FOUND', 'Reported review not found');
      if (target.revieweeId.toString() === reporterId) {
        throw new HttpError(400, 'CANNOT_REPORT_SELF', 'You cannot report a review of yourself');
      }
      return { ownerId: target.revieweeId.toString() };
    }
    case 'post': {
      const target = await CommunityPost.findById(id);
      if (!target || target.isDeleted) {
        throw new HttpError(404, 'TARGET_NOT_FOUND', 'Reported post not found');
      }
      if (target.authorId.toString() === reporterId) {
        throw new HttpError(400, 'CANNOT_REPORT_SELF', 'You cannot report your own post');
      }
      return { ownerId: target.authorId.toString() };
    }
    case 'message': {
      const target = await Message.findById(id);
      if (!target) throw new HttpError(404, 'TARGET_NOT_FOUND', 'Reported message not found');

      const connection = await Connection.findById(target.connectionId);
      if (!connection) {
        throw new HttpError(404, 'CONNECTION_NOT_FOUND', 'Conversation not found');
      }
      const participantIds = [connection.requesterId.toString(), connection.teacherId.toString()];
      if (!participantIds.includes(reporterId)) {
        throw new HttpError(403, 'NOT_PARTICIPANT', 'You are not a participant in this conversation');
      }
      return { connectionId: connection._id as Types.ObjectId };
    }
    default:
      throw new HttpError(400, 'VALIDATION_ERROR', 'Unsupported report target');
  }
}

async function captureMessageContext(
  messageId: Types.ObjectId,
  connectionId: Types.ObjectId
): Promise<Types.ObjectId[]> {
  const target = await Message.findById(messageId);
  if (!target) return [];

  const before = await Message.find({
    connectionId,
    _id: { $lte: messageId },
  })
    .sort({ createdAt: -1 })
    .limit(6)
    .select('_id');

  const after = await Message.find({
    connectionId,
    _id: { $gt: messageId },
  })
    .sort({ createdAt: 1 })
    .limit(5)
    .select('_id');

  const ids = [...before.map((m) => m._id), ...after.map((m) => m._id)];
  return ids.sort((a, b) => a.toString().localeCompare(b.toString()));
}

export async function submitReport(input: SubmitReportInput) {
  const reporterId = toObjectId(input.reporterId);
  const targetId = toObjectId(input.targetId);

  if (!(input.targetType in REASONS_BY_TARGET)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid report target type');
  }
  if (!REASONS_BY_TARGET[input.targetType].includes(input.reason)) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      `Reason "${input.reason}" is not valid for ${input.targetType} reports`
    );
  }
  if (input.description && input.description.length > 300) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Description must be 300 characters or fewer');
  }

  const duplicate = await Report.findOne({
    reporterId,
    targetType: input.targetType,
    targetId,
    status: { $in: ['open', 'under_review'] },
  });
  if (duplicate) {
    throw new HttpError(409, 'ALREADY_REPORTED', 'You have already reported this content');
  }

  const { connectionId } = await assertTargetAllowed(
    input.targetType,
    input.targetId,
    input.reporterId
  );

  const contextMessages =
    input.targetType === 'message' && connectionId
      ? await captureMessageContext(targetId, connectionId)
      : undefined;

  if (input.targetType === 'message') {
    await Message.updateOne({ _id: targetId }, { $set: { isReported: true } });
  }

  const report = await Report.create({
    reporterId,
    targetType: input.targetType,
    targetId,
    reason: input.reason,
    description: input.description || undefined,
    contextMessages,
  });

  return { report: await getReportDetail(report._id.toString()) };
}

async function populateTargets(reports: (Record<string, unknown> & { targetType: ReportTargetType; targetId: Types.ObjectId })[]) {
  const byType = new Map<ReportTargetType, Types.ObjectId[]>();
  for (const report of reports) {
    const list = byType.get(report.targetType) || [];
    list.push(report.targetId);
    byType.set(report.targetType, list);
  }

  const cache = new Map<string, Record<string, unknown> | null>();

  async function load(type: ReportTargetType, ids: Types.ObjectId[]) {
    switch (type) {
      case 'user': {
        const docs = await User.find({ _id: { $in: ids } })
          .select('displayName email avatar role status')
          .lean();
        for (const doc of docs) {
          cache.set(`${type}:${doc._id.toString()}`, doc as unknown as Record<string, unknown>);
        }
        return;
      }
      case 'skill': {
        const docs = await Skill.find({ _id: { $in: ids } })
          .select('skillName categoryName type isDeleted')
          .lean();
        for (const doc of docs) {
          cache.set(`${type}:${doc._id.toString()}`, doc as unknown as Record<string, unknown>);
        }
        return;
      }
      case 'message': {
        const docs = await Message.find({ _id: { $in: ids } })
          .select('content isReported')
          .lean();
        for (const doc of docs) {
          cache.set(`${type}:${doc._id.toString()}`, doc as unknown as Record<string, unknown>);
        }
        return;
      }
      case 'review': {
        const docs = await Review.find({ _id: { $in: ids } }).select('rating content').lean();
        for (const doc of docs) {
          cache.set(`${type}:${doc._id.toString()}`, doc as unknown as Record<string, unknown>);
        }
        return;
      }
      case 'post': {
        const docs = await CommunityPost.find({ _id: { $in: ids } }).select('content').lean();
        for (const doc of docs) {
          cache.set(`${type}:${doc._id.toString()}`, doc as unknown as Record<string, unknown>);
        }
        return;
      }
    }
  }

  await Promise.all([...byType.entries()].map(([type, ids]) => load(type, ids)));

  return reports.map((report) => ({
    ...report,
    target: cache.get(`${report.targetType}:${report.targetId.toString()}`) || null,
  }));
}

export async function populateReportTargets(report: Record<string, unknown> & { targetType: ReportTargetType; targetId: Types.ObjectId }) {
  const [enriched] = await populateTargets([report]);
  return enriched;
}

export interface ListReportsQuery {
  page?: number;
  limit?: number;
  status?: string;
  targetType?: string;
}

export async function listReports(query: ListReportsQuery) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const filter: Record<string, unknown> = {};

  const validStatuses: ReportStatus[] = ['open', 'under_review', 'resolved', 'dismissed'];
  if (query.status && (validStatuses as string[]).includes(query.status)) {
    filter.status = query.status;
  }
  if (query.targetType && query.targetType in REASONS_BY_TARGET) {
    filter.targetType = query.targetType;
  }

  const [docs, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('reporterId', 'displayName avatar email')
      .populate('assignedTo', 'displayName')
      .lean(),
    Report.countDocuments(filter),
  ]);

  const sorted = [...docs].sort((a, b) => {
    const diff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const enriched = await populateTargets(
    sorted as unknown as (Record<string, unknown> & { targetType: ReportTargetType; targetId: Types.ObjectId })[]
  );

  return {
    reports: enriched.map((report) => normalizeReport(report)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getReportDetail(reportId: string) {
  if (!Types.ObjectId.isValid(reportId)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid report id');
  }
  const report = await Report.findById(reportId)
    .populate('reporterId', 'displayName avatar email')
    .populate('assignedTo', 'displayName')
    .lean();
  if (!report) {
    throw new HttpError(404, 'REPORT_NOT_FOUND', 'Report not found');
  }
  return normalizeReport(
    await populateReportTargets(
      report as unknown as Record<string, unknown> & { targetType: ReportTargetType; targetId: Types.ObjectId }
    )
  );
}

export async function assignReport(reportId: string, adminId: string) {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new HttpError(404, 'REPORT_NOT_FOUND', 'Report not found');
  }
  if (report.status !== 'open' && report.status !== 'under_review') {
    throw new HttpError(400, 'REPORT_CLOSED', 'This report has already been resolved');
  }
  report.assignedTo = new Types.ObjectId(adminId);
  report.status = 'under_review';
  await report.save();
  return { report: await getReportDetail(reportId) };
}

export interface ResolveReportInput {
  status: 'resolved' | 'dismissed';
  action?: ReportAction;
  resolution?: string;
}

export async function resolveReport(reportId: string, input: ResolveReportInput) {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new HttpError(404, 'REPORT_NOT_FOUND', 'Report not found');
  }
  if (report.status === 'resolved' || report.status === 'dismissed') {
    throw new HttpError(400, 'REPORT_CLOSED', 'This report has already been resolved');
  }
  if (input.status === 'resolved' && !input.action) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'An action is required to resolve a report');
  }
  if (input.resolution && input.resolution.length > 500) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Resolution must be 500 characters or fewer');
  }

  report.status = input.status;
  if (input.action) report.action = input.action;
  if (input.resolution) report.resolution = input.resolution;
  await report.save();

  return { report: await getReportDetail(reportId) };
}

function normalizeReport(report: Record<string, unknown>): Record<string, unknown> {
  const reporter = report.reporterId as Record<string, unknown> | null;
  const assignedTo = report.assignedTo as Record<string, unknown> | null;
  return {
    _id: report._id,
    targetType: report.targetType,
    targetId: report.targetId,
    reason: report.reason,
    description: report.description,
    status: report.status,
    action: report.action,
    resolution: report.resolution,
    contextMessages: Array.isArray(report.contextMessages) ? report.contextMessages : [],
    reporter: reporter
      ? { _id: reporter._id, displayName: reporter.displayName, avatar: reporter.avatar, email: reporter.email }
      : null,
    assignedTo: assignedTo ? assignedTo._id : undefined,
    target: report.target,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}
