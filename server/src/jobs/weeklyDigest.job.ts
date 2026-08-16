import { Job } from 'bull';
import { Types } from 'mongoose';
import { Skill, SkillRadar, User } from '../models';
import { createNotification } from '../services/notification';
import { getBlockedIds } from '../services/block.service';
import { applyRadiusFilter } from '../services/savedSearch';

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ALERTED = 500;
const EMAIL_MAX = 3;

type SkillLite = { _id: Types.ObjectId; skillName: string; categoryName: string; format: string };

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function buildWeeklyDigestEmail(displayName: string, skills: SkillLite[]): string {
  const greeting = escapeHtml(displayName);
  const items = skills
    .slice(0, EMAIL_MAX)
    .map(
      (s) => `<li style="margin:6px 0"><strong>${escapeHtml(s.skillName)}</strong> &mdash; ${escapeHtml(s.categoryName)} (${escapeHtml(s.format)})</li>`
    )
    .join('');
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#fff7ed;border-radius:12px">
<h1 style="color:#c2410c;margin:0 0 8px">The Hearth Weekly Digest</h1>
<p>Hi ${greeting},</p>
<p>Here is what matched your Skill Radar this week:</p>
<ul>${items}</ul>
<p><a href="/radar" style="display:inline-block;margin-top:12px;background:#c2410c;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Open My Radar</a></p>
<p style="color:#78716c;font-size:12px">You're receiving this because weekly digest is enabled. Turn it off in your profile settings.</p>
</div>`;
}

export async function processWeeklyDigest(job: Job): Promise<void> {
  console.log('[Job:WeeklyDigest] Processing...');

  const since = new Date(Date.now() - WINDOW_MS);
  const users = await User.find({
    isEmailVerified: true,
    status: 'active',
    isShadowBanned: { $ne: true },
    weeklyDigest: true,
  }).select('_id displayName email').lean();

  let sent = 0;

  for (const user of users) {
    const uid = String(user._id);
    try {
      const radar = await SkillRadar.findOne({ userId: user._id }).lean();
      if (!radar || (radar.intents.length === 0 && radar.manualRadars.length === 0)) continue;

      const blockedIds = (await getBlockedIds(uid)).map((b) => new Types.ObjectId(b));
      const notMe: Record<string, unknown> = {
        userId: { $ne: user._id, $nin: blockedIds },
      };

      const seen = new Set<string>();
      const found: SkillLite[] = [];
      const appended: Array<{ kind: 'intents' | 'manualRadars'; idx: number; ids: Types.ObjectId[] }> = [];

      const consume = async (kind: 'intents' | 'manualRadars', idx: number, base: Record<string, unknown>, alerted: Array<Types.ObjectId | string>) => {
        const match: Record<string, unknown> = {
          ...base,
          isActive: true,
          isDeleted: false,
          createdAt: { $gte: since },
        };
        if (alerted.length) match._id = { $nin: alerted };
        const skills = await Skill.find(match).select('_id skillName categoryName format').sort({ createdAt: -1 }).limit(50).lean();
        const fresh = skills.filter((s) => !seen.has(String(s._id)));
        if (fresh.length === 0) return;
        fresh.forEach((s) => seen.add(String(s._id)));
        appended.push({ kind, idx, ids: fresh.map((s) => s._id) });
        found.push(...(fresh as unknown as SkillLite[]));
      };

      const targets: Promise<void>[] = [];

      radar.intents.forEach((intent, idx) => {
        if (intent.status !== 'active') return;
        const base: Record<string, unknown> = { ...notMe, type: 'teach', categoryName: intent.category };
        if (intent.preferredFormat && intent.preferredFormat !== 'either') {
          base.format = { $in: [intent.preferredFormat, 'either'] };
        }
        targets.push(consume('intents', idx, base, intent.alertedSkillIds));
      });

      radar.manualRadars.forEach((manual, idx) => {
        const f = manual.filters ?? {};
        const base: Record<string, unknown> = { ...notMe, type: f.type || 'teach' };
        if (f.category) base.categoryName = f.category;
        if (f.format && f.format !== 'either') base.format = { $in: [f.format, 'either'] };
        if (f.proficiencyLevel) base.proficiencyLevel = f.proficiencyLevel;
        targets.push(
          applyRadiusFilter(base, f.radius, uid).then(() => consume('manualRadars', idx, base, manual.alertedSkillIds)),
        );
      });

      await Promise.all(targets);

      if (found.length === 0) continue;

      const $push: Record<string, unknown> = {};
      const $set: Record<string, unknown> = {};
      for (const entry of appended) {
        $push[`${entry.kind}.${entry.idx}.alertedSkillIds`] = { $each: entry.ids, $slice: -MAX_ALERTED };
        $set[`${entry.kind}.${entry.idx}.lastAlertedAt`] = new Date();
      }
      await SkillRadar.updateOne({ _id: radar._id }, { $push, $set });

      const names = found.slice(0, 3).map((s) => s.skillName).join(', ');
      const extra = found.length > 3 ? ` +${found.length - 3} more` : '';
      const message = `Your weekly digest: ${found.length} new skill${found.length === 1 ? '' : 's'} match your radar: ${names}${extra}`;

      await createNotification({
        userId: uid,
        type: 'weekly_digest',
        referenceId: radar._id,
        referenceModel: 'SkillRadar',
        message,
      });

      console.log(`[WeeklyDigest] User: ${user.displayName} (${user.email}) | ${found.length} new matches`);
      console.log(buildWeeklyDigestEmail(user.displayName, found));
      sent++;
    } catch (err) {
      console.error(`[Job:WeeklyDigest] Error for user ${uid}:`, err);
    }
  }

  console.log(`[Job:WeeklyDigest] Processed ${sent} users`);
}
