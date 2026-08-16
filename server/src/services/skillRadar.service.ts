import { Types } from 'mongoose';
import { SkillRadar, Skill, User } from '../models';
import { getBlockedIds } from './block.service';
import { HttpError } from '../utils/errors';
import { TEACHER_LOOKUP, mapSkill } from './savedSearch';
import type { ISkillRadarIntent, IManualRadar, IManualRadarFilter, RadarConfidence, RadarFormat, RadarSignalType } from '../models/SkillRadar';

const BASE_WEIGHTS: Record<RadarSignalType, number> = {
  search: 1.0,
  skill_view: 0.8,
  profile_view: 0.6,
  category_browse: 0.5,
  swap_declined: 0.3,
  message_sent: 0.9,
  endorsement_given: 0.4,
};

const SIGNAL_LABELS: Record<RadarSignalType, string> = {
  search: 'searched',
  skill_view: 'viewed',
  profile_view: 'checked profiles',
  category_browse: 'browsed',
  swap_declined: 'declined swaps',
  message_sent: 'messaged',
  endorsement_given: 'endorsed',
};

const SIGNAL_UNITS: Record<RadarSignalType, string> = {
  search: 'times',
  skill_view: 'skills',
  profile_view: 'profiles',
  category_browse: 'times',
  swap_declined: 'swaps',
  message_sent: 'people',
  endorsement_given: 'skills',
};

export const MAX_SIGNALS = 500;
const MAX_SIGNAL_AGE_DAYS = 30;
const HALF_LIFE_DAYS = 14;

export function decayedWeight(baseWeight: number, ageDays: number): number {
  return baseWeight * Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
}

export function confidenceForWeight(totalWeight: number): RadarConfidence | null {
  if (totalWeight >= 3.0) return 'high';
  if (totalWeight >= 1.5) return 'medium';
  if (totalWeight >= 0.8) return 'low';
  return null;
}

export interface RadarSignalInput {
  type: RadarSignalType;
  category?: string;
  skillName?: string;
  format?: string;
}

export async function recordSignal(userId: string, signal: RadarSignalInput): Promise<void> {
  try {
    if (!signal.type || !BASE_WEIGHTS[signal.type]) return;
    const weight = BASE_WEIGHTS[signal.type];
    await SkillRadar.updateOne(
      { userId: new Types.ObjectId(userId) },
      {
        $push: { signals: { $each: [{ ...signal, weight, timestamp: new Date() }], $slice: -MAX_SIGNALS } },
        $setOnInsert: { intents: [], manualRadars: [] },
      },
      { upsert: true }
    );
  } catch (err) {
    // Fire-and-forget by contract: never let signal recording break a hot path.
    console.warn('[SkillRadar] recordSignal failed:', err);
  }
}

export async function getRadarForUser(userId: string) {
  const radar = await SkillRadar.findOne({ userId: new Types.ObjectId(userId) }).lean();
  if (!radar) return null;
  return {
    userId: String(radar.userId),
    intents: radar.intents ?? [],
    manualRadars: radar.manualRadars ?? [],
    updatedAt: radar.updatedAt,
  };
}

export async function recomputeIntents(userId: string): Promise<ISkillRadarIntent[]> {
  const radar = await SkillRadar.findOne({ userId: new Types.ObjectId(userId) });
  if (!radar) return [];

  const now = Date.now();
  const cutoff = new Date(now - MAX_SIGNAL_AGE_DAYS * 86400000);
  const recent = radar.signals.filter((s) => s.timestamp >= cutoff);
  if (recent.length === 0) return radar.intents;

  const byCategory = new Map<string, typeof recent>();
  for (const s of recent) {
    const key = (s.category || 'other').trim();
    if (!key) continue;
    const list = byCategory.get(key) ?? [];
    list.push(s);
    byCategory.set(key, list);
  }

  const existing = new Map(radar.intents.map((i) => [i.category, i]));
  const newIntents: ISkillRadarIntent[] = [];

  for (const [category, signals] of byCategory) {
    const totalWeight = signals.reduce((sum, s) => sum + decayedWeight(s.weight, (now - s.timestamp.getTime()) / 86400000), 0);
    const confidence = confidenceForWeight(totalWeight);
    if (!confidence) continue;

    const prev = existing.get(category);
    const preferredFormat = majorityFormat(signals) ?? prev?.preferredFormat ?? 'either';

    const skillNames: string[] = [];
    for (const s of signals) {
      if (s.skillName && !skillNames.includes(s.skillName)) skillNames.push(s.skillName);
      if (skillNames.length >= 10) break;
    }

    newIntents.push({
      category,
      inferredSkillNames: skillNames,
      confidence,
      preferredFormat,
      preferredRadius: prev?.preferredRadius,
      reasoning: buildReasoning(signals),
      status: prev?.status ?? 'active',
      lastAlertedAt: prev?.lastAlertedAt,
      alertedSkillIds: prev?.alertedSkillIds ?? [],
      matchCount: prev?.matchCount ?? 0,
    });
  }

  // Preserve any intent categories that no longer have signals (do not destroy user's history).
  for (const [category, prev] of existing) {
    if (!newIntents.some((i) => i.category === category)) newIntents.push(prev);
  }

  radar.intents = newIntents;
  await radar.save();
  return newIntents;
}

function majorityFormat(signals: Array<{ format?: string }>): RadarFormat | undefined {
  const counts = new Map<string, number>();
  for (const s of signals) {
    if (!s.format || !['online', 'in-person', 'either'].includes(s.format)) continue;
    counts.set(s.format, (counts.get(s.format) ?? 0) + 1);
  }
  if (counts.size === 0) return undefined;
  let best = '';
  let bestCount = 0;
  for (const [format, count] of counts) {
    if (count > bestCount) {
      best = format;
      bestCount = count;
    }
  }
  return best as RadarFormat;
}

function buildReasoning(signals: Array<{ type: RadarSignalType }>): string {
  const counts = new Map<RadarSignalType, number>();
  for (const s of signals) counts.set(s.type, (counts.get(s.type) ?? 0) + 1);
  const clauses: string[] = [];
  for (const [type, count] of counts) {
    if (clauses.length >= 3) break;
    clauses.push(`${SIGNAL_LABELS[type]} ${count} ${SIGNAL_UNITS[type]}`);
  }
  return clauses.length ? `Based on your activity: you ${clauses.join(', ')}.` : '';
}

export async function getActiveIntentsForCategory(category: string) {
  const radars = await SkillRadar.find({
    'intents.category': category,
    'intents.status': 'active',
  }).lean();
  return radars
    .map((r) => ({
      userId: String(r.userId),
      intent: r.intents.find((i) => i.category === category && i.status === 'active')!,
    }))
    .filter((x) => !!x.intent);
}

export async function getNewMatchesSince(userId: string, sinceDate: Date): Promise<Array<Record<string, unknown>>> {
  const radar = await SkillRadar.findOne({ userId: new Types.ObjectId(userId) }).lean();
  if (!radar) return [];

  const blocked = await getBlockedIds(userId);
  const queries: Array<Record<string, unknown>> = [];

  for (const intent of radar.intents) {
    if (intent.status !== 'active') continue;
    const match: Record<string, unknown> = {
      isActive: true,
      isDeleted: false,
      type: 'teach',
      categoryName: intent.category,
      userId: { $ne: new Types.ObjectId(userId), $nin: blocked.map((b) => new Types.ObjectId(b)) },
      createdAt: { $gte: sinceDate },
      _id: { $nin: intent.alertedSkillIds },
    };
    if (intent.preferredFormat && intent.preferredFormat !== 'either') match.format = { $in: [intent.preferredFormat, 'either'] };
    queries.push(match);
  }

  for (const manual of radar.manualRadars) {
    const f = manual.filters ?? {};
    const match: Record<string, unknown> = {
      isActive: true,
      isDeleted: false,
      type: f.type || 'teach',
      userId: { $ne: new Types.ObjectId(userId), $nin: blocked.map((b) => new Types.ObjectId(b)) },
      createdAt: { $gte: sinceDate },
      _id: { $nin: manual.alertedSkillIds },
    };
    if (f.category) match.categoryName = f.category;
    if (f.format && f.format !== 'either') match.format = { $in: [f.format, 'either'] };
    if (f.proficiencyLevel) match.proficiencyLevel = f.proficiencyLevel;
    queries.push(match);
  }

  if (queries.length === 0) return [];

  const skills = await Skill.find({ $or: queries })
    .populate('userId', 'displayName avatar location status isShadowBanned stats')
    .lean()
    .limit(50);

  return skills.map((s: any) => {
    const teacher = s.userId as any;
    if (!teacher || teacher.status !== 'active' || teacher.isShadowBanned) return null;
    const { userId, ...rest } = s;
    return {
      ...rest,
      skillId: String(userId),
      teacher: teacher
        ? {
            _id: String(teacher._id),
            displayName: teacher.displayName,
            avatar: teacher.avatar,
            stats: teacher.stats,
          }
        : undefined,
    };
  }).filter(Boolean);
}

export async function countIntentMatches(userId: string): Promise<Record<string, number>> {
  const radar = await SkillRadar.findOne({ userId: new Types.ObjectId(userId) }).lean();
  if (!radar || radar.intents.length === 0) return {};

  const blocked = await getBlockedIds(userId);
  const result: Record<string, number> = {};
  for (const intent of radar.intents) {
    if (intent.status !== 'active') continue;
    const match: Record<string, unknown> = {
      isActive: true,
      isDeleted: false,
      type: 'teach',
      categoryName: intent.category,
      userId: { $ne: new Types.ObjectId(userId), $nin: blocked.map((b) => new Types.ObjectId(b)) },
    };
    if (intent.preferredFormat && intent.preferredFormat !== 'either') match.format = { $in: [intent.preferredFormat, 'either'] };
    result[intent.category] = await Skill.countDocuments(match);
  }
  return result;
}

export async function updateIntentStatus(userId: string, category: string, status: 'active' | 'paused' | 'dismissed'): Promise<void> {
  const radar = await SkillRadar.findOne({ userId: new Types.ObjectId(userId) });
  if (!radar) throw new HttpError(404, 'RADAR_NOT_FOUND', 'No skill radar found');
  const intent = radar.intents.find((i) => i.category === category);
  if (!intent) throw new HttpError(404, 'INTENT_NOT_FOUND', 'Intent not found');
  intent.status = status;
  await radar.save();
}

export async function getIntentMatches(userId: string, category: string, limit = 5): Promise<Array<Record<string, unknown>>> {
  const radar = await SkillRadar.findOne({ userId: new Types.ObjectId(userId) }).lean();
  const intent = radar?.intents.find((i) => i.category === category);
  if (!intent) throw new HttpError(404, 'INTENT_NOT_FOUND', 'Intent not found');
  if (intent.status !== 'active') return [];

  const blocked = await getBlockedIds(userId);
  const match: Record<string, unknown> = {
    isDeleted: false,
    isActive: true,
    type: 'teach',
    categoryName: intent.category,
    userId: { $ne: new Types.ObjectId(userId), $nin: blocked.map((b) => new Types.ObjectId(b)) },
  };
  if (intent.preferredFormat && intent.preferredFormat !== 'either') {
    match.format = { $in: [intent.preferredFormat, 'either'] };
  }

  const skills = await Skill.aggregate([
    { $match: match },
    { $sort: { createdAt: -1 } },
    { $limit: Math.max(1, Math.min(limit, 20)) },
    ...TEACHER_LOOKUP,
  ]);

  return skills.map((s) => mapSkill(s));
}

export async function createManualRadar(
  userId: string,
  input: { name: string; filters: IManualRadarFilter }
): Promise<IManualRadar> {
  const name = input.name?.trim();
  if (!name) throw new HttpError(400, 'VALIDATION_ERROR', 'Manual radar name is required');
  if (name.length > 60) throw new HttpError(400, 'VALIDATION_ERROR', 'Manual radar name is too long');

  let radar = await SkillRadar.findOne({ userId: new Types.ObjectId(userId) });
  if (!radar) {
    radar = await SkillRadar.create({ userId: new Types.ObjectId(userId), signals: [], intents: [], manualRadars: [] });
  }

  const duplicate = radar.manualRadars.some((m) => m.name.trim().toLowerCase() === name.toLowerCase());
  if (duplicate) throw new HttpError(409, 'MANUAL_RADAR_EXISTS', 'A manual radar with this name already exists');

  const filters: IManualRadarFilter = {
    category: input.filters?.category,
    type: input.filters?.type,
    format: input.filters?.format,
    proficiencyLevel: input.filters?.proficiencyLevel,
    radius: input.filters?.radius,
    availability: input.filters?.availability,
  };

  const created = { name, filters, alertedSkillIds: [] };
  radar.manualRadars.push(created);
  await radar.save();
  const fresh = await SkillRadar.findOne({ userId: new Types.ObjectId(userId) }).lean();
  const result = fresh?.manualRadars.find((m) => m.name === name);
  if (!result) throw new HttpError(500, 'RADAR_SAVE_FAILED', 'Failed to save manual radar');
  return result;
}

export async function deleteManualRadar(userId: string, manualId: string): Promise<void> {
  const radar = await SkillRadar.findOne({ userId: new Types.ObjectId(userId) });
  if (!radar) throw new HttpError(404, 'RADAR_NOT_FOUND', 'No skill radar found');
  const before = radar.manualRadars.length;
  radar.manualRadars = radar.manualRadars.filter((m) => String(m._id) !== manualId);
  if (radar.manualRadars.length === before) throw new HttpError(404, 'MANUAL_RADAR_NOT_FOUND', 'Manual radar not found');
  await radar.save();
}

export async function getActiveUserIds(): Promise<string[]> {
  const users = await User.find({ status: 'active', isShadowBanned: false }).select('_id').lean();
  return users.map((u) => String(u._id));
}
