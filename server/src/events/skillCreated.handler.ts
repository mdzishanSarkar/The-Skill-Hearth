import { Types } from 'mongoose';
import { SkillRadar, User } from '../models';
import type { IManualRadar, ISkillRadarIntent } from '../models/SkillRadar';
import { getBlockedIds } from '../services/block.service';
import { createNotification } from '../services/notification';
import { recomputeMatchesForSkill } from '../services/swapReadyMatch.service';

const EARTH_RADIUS_KM = 6378.1;

function haversineKm(a: number[] | undefined, b: number[] | undefined): number | null {
  if (!Array.isArray(a) || a.length < 2 || !Array.isArray(b) || b.length < 2) return null;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function intentMatches(intent: ISkillRadarIntent, skill: Record<string, any>): boolean {
  if (intent.status !== 'active') return false;
  if (intent.category !== skill.categoryName) return false;
  if (intent.preferredFormat && intent.preferredFormat !== 'either' && intent.preferredFormat !== skill.format) {
    return false;
  }
  return true;
}

function manualMatches(manual: IManualRadar, skill: Record<string, any>, ownerCoords: number[] | undefined): boolean {
  const f = manual.filters ?? {};
  if (f.type && f.type !== skill.type) return false;
  if (f.category && f.category !== skill.categoryName) return false;
  if (f.format && f.format !== 'either' && f.format !== skill.format) return false;
  if (f.proficiencyLevel && f.proficiencyLevel !== skill.proficiencyLevel) return false;
  if (f.radius && f.radius > 0) {
    const km = haversineKm(skill.location?.coordinates, ownerCoords);
    if (km === null || km > f.radius) return false;
  }
  return true;
}

function alreadyAlerted(skillId: string, alertedSkillIds: Array<Types.ObjectId | string>): boolean {
  return alertedSkillIds.some((id) => String(id) === skillId);
}

/**
 * Instant match notifications — called fire-and-forget whenever a teach skill
 * is created. Finds every user whose Skill Radar intent or manual radar matches
 * the new skill and sends a single `radar_match` notification per user,
 * honoring blocks, self-exclusion, shadow-ban status and quiet hours.
 */
export async function onSkillCreated(skill: Record<string, any>): Promise<void> {
  try {
    if (!skill?._id || !skill?.userId || !skill?.categoryName) return;

    void recomputeMatchesForSkill(skill);

    const skillId = String(skill._id);
    const ownerId = String(skill.userId);
    const blockedIds = (await getBlockedIds(ownerId)).map((b) => new Types.ObjectId(b));

    const radars = await SkillRadar.find({
      userId: { $ne: new Types.ObjectId(ownerId), $nin: blockedIds },
    }).lean();

    const matches: Array<{
      radar: Record<string, any>;
      intentIdx: number[];
      manualIdx: number[];
    }> = [];

    for (const radar of radars) {
      const owner = await User.findById(radar.userId).select('status isShadowBanned location').lean();
      if (!owner || owner.status !== 'active' || owner.isShadowBanned) continue;

      const ownerCoords = (owner.location as { coordinates?: number[] } | undefined)?.coordinates;

      const intentIdx = radar.intents
        .map((intent: ISkillRadarIntent, idx: number) => ({ intent, idx }))
        .filter(({ intent }) => intentMatches(intent, skill))
        .filter(({ intent }) => !alreadyAlerted(skillId, intent.alertedSkillIds))
        .map(({ idx }) => idx);

      const manualIdx = radar.manualRadars
        .map((manual: IManualRadar, idx: number) => ({ manual, idx }))
        .filter(({ manual }) => manualMatches(manual, skill, ownerCoords))
        .filter(({ manual }) => !alreadyAlerted(skillId, manual.alertedSkillIds))
        .map(({ idx }) => idx);

      if (intentIdx.length > 0 || manualIdx.length > 0) {
        matches.push({ radar, intentIdx, manualIdx });
      }
    }

    for (const { radar, intentIdx, manualIdx } of matches) {
      const $push: Record<string, unknown> = {};
      const $set: Record<string, unknown> = {};
      for (const idx of intentIdx) {
        $push[`intents.${idx}.alertedSkillIds`] = skill._id;
        $set[`intents.${idx}.lastAlertedAt`] = new Date();
      }
      for (const idx of manualIdx) {
        $push[`manualRadars.${idx}.alertedSkillIds`] = skill._id;
        $set[`manualRadars.${idx}.lastAlertedAt`] = new Date();
      }
      await SkillRadar.updateOne({ _id: radar._id }, { $push, $set });

      await createNotification({
        userId: String(radar.userId),
        type: 'radar_match',
        message: `New match for your radar: ${skill.skillName} (${skill.categoryName})`,
        referenceId: skillId,
        referenceModel: 'Skill',
      });
    }
  } catch (err) {
    console.error('[skillCreated] radar notification error:', err);
  }
}
