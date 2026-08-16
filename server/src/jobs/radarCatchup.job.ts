import { Job } from 'bull';
import { Types } from 'mongoose';
import { Skill, SkillRadar, User } from '../models';
import { createNotification } from '../services/notification';
import { getBlockedIds } from '../services/block.service';
import { applyRadiusFilter } from '../services/savedSearch';

const THROTTLE_MS = 6 * 60 * 60 * 1000;
const FALLBACK_THRESHOLD = 20;
const MAX_ALERTED = 500;

type SkillLite = { _id: Types.ObjectId; skillName: string; categoryName: string };

async function findNewSkills(
  base: Record<string, unknown>,
  since: Date,
  alerted: Array<Types.ObjectId | string>,
): Promise<SkillLite[]> {
  const match: Record<string, unknown> = {
    ...base,
    isActive: true,
    isDeleted: false,
    createdAt: { $gte: since },
  };
  if (alerted.length) match._id = { $nin: alerted };
  return Skill.find(match)
    .select('_id skillName categoryName')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
}

function buildSummaryMessage(skills: SkillLite[]): string {
  const names = skills.slice(0, 3).map((s) => s.skillName).join(', ');
  const extra = skills.length > 3 ? ` +${skills.length - 3} more` : '';
  return `${skills.length} new skill${skills.length === 1 ? '' : 's'} match your radar: ${names}${extra}`;
}

export async function processRadarCatchup(job: Job): Promise<void> {
  console.log('[Job:RadarCatchup] Processing...');

  const radars = await SkillRadar.find().lean();
  let notifiedUsers = 0;

  for (const radar of radars) {
    const uid = String(radar.userId);
    try {
      const user = await User.findById(radar.userId).select('status isShadowBanned').lean();
      if (!user || user.status !== 'active' || user.isShadowBanned) continue;

      const blockedIds = (await getBlockedIds(uid)).map((b) => new Types.ObjectId(b));
      const since = new Date(Date.now() - THROTTLE_MS);
      const notMe: Record<string, unknown> = {
        userId: { $ne: radar.userId, $nin: blockedIds },
      };

      const allNew: SkillLite[] = [];
      const appended: Array<{ kind: 'intents' | 'manualRadars'; idx: number; ids: Types.ObjectId[] }> = [];

      const appendTargets: Array<{ kind: 'intents' | 'manualRadars'; idx: number; base: Record<string, unknown>; alerted: Array<Types.ObjectId | string> }> = [];

      for (let idx = 0; idx < radar.intents.length; idx++) {
        const intent = radar.intents[idx];
        if (intent.status !== 'active') continue;
        const base: Record<string, unknown> = {
          ...notMe,
          type: 'teach',
          categoryName: intent.category,
        };
        if (intent.preferredFormat && intent.preferredFormat !== 'either') {
          base.format = { $in: [intent.preferredFormat, 'either'] };
        }
        appendTargets.push({ kind: 'intents', idx, base, alerted: intent.alertedSkillIds });
      }

      for (let idx = 0; idx < radar.manualRadars.length; idx++) {
        const manual = radar.manualRadars[idx];
        const f = manual.filters ?? {};
        const base: Record<string, unknown> = {
          ...notMe,
          type: f.type || 'teach',
        };
        if (f.category) base.categoryName = f.category;
        if (f.format && f.format !== 'either') base.format = { $in: [f.format, 'either'] };
        if (f.proficiencyLevel) base.proficiencyLevel = f.proficiencyLevel;
        await applyRadiusFilter(base, f.radius, uid);
        appendTargets.push({ kind: 'manualRadars', idx, base, alerted: manual.alertedSkillIds });
      }

      for (const target of appendTargets) {
        const skills = await findNewSkills(target.base, since, target.alerted);
        if (skills.length === 0) continue;
        const seen = new Set(allNew.map((s) => String(s._id)));
        const fresh = skills.filter((s) => !seen.has(String(s._id)));
        if (fresh.length === 0) continue;
        appended.push({
          kind: target.kind,
          idx: target.idx,
          ids: fresh.map((s) => s._id),
        });
        allNew.push(...fresh);
      }

      if (allNew.length === 0) continue;

      // Append to alertedSkillIds + lastAlertedAt on the matched intent/manual entries.
      const $push: Record<string, unknown> = {};
      const $set: Record<string, unknown> = {};
      for (const entry of appended) {
        $push[`${entry.kind}.${entry.idx}.alertedSkillIds`] = { $each: entry.ids, $slice: -MAX_ALERTED };
        $set[`${entry.kind}.${entry.idx}.lastAlertedAt`] = new Date();
      }
      await SkillRadar.updateOne({ _id: radar._id }, { $push, $set });

      // One notification per user. Fall back to a warning if they're swamped.
      if (allNew.length > FALLBACK_THRESHOLD) {
        await createNotification({
          userId: uid,
          type: 'radar_match',
          message: `You have ${allNew.length} new matches waiting on your Skill Radar. Open My Radar to review them.`,
        });
      } else {
        await createNotification({
          userId: uid,
          type: 'radar_match',
          referenceId: radar._id,
          referenceModel: 'SkillRadar',
          message: buildSummaryMessage(allNew),
        });
      }
      notifiedUsers++;
    } catch (err) {
      console.error(`[Job:RadarCatchup] Error for user ${uid}:`, err);
    }
  }

  console.log(`[Job:RadarCatchup] Notified ${notifiedUsers} users`);
}
