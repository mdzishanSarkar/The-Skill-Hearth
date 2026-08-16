import { Category, Skill } from '../models';
import { recordSignal } from './skillRadar.service';
import type { RadarSignalType } from '../models/SkillRadar';

// All signal helpers are fire-and-forget by contract: they never throw and
// are never awaited by callers. Signal recording must not slow hot paths.

function safe(fn: () => Promise<void>): void {
  fn().catch((err) => console.warn('[RadarSignal]', err));
}

export function signalSearch(userId: string | undefined, keyword?: string): void {
  if (!userId || !keyword?.trim()) return;
  const kw = keyword.trim().slice(0, 80);
  safe(() => recordSignal(userId, { type: 'search', skillName: kw, category: kw }));
}

export function signalCategoryBrowse(userId: string | undefined, categoryId?: string): void {
  if (!userId || !categoryId) return;
  safe(async () => {
    const category = await Category.findById(categoryId).select('name').lean();
    if (category) await recordSignal(userId, { type: 'category_browse', category: category.name });
  });
}

export function signalSkillView(
  userId: string | undefined,
  skill?: { categoryName?: string; skillName?: string; format?: string } | null,
): void {
  if (!userId || !skill) return;
  const format = ['online', 'in-person', 'either'].includes(skill.format ?? '') ? (skill.format as 'online' | 'in-person' | 'either') : undefined;
  safe(() => recordSignal(userId, { type: 'skill_view', category: skill.categoryName, skillName: skill.skillName, format }));
}

export function signalProfileView(userId: string | undefined): void {
  if (!userId) return;
  safe(() => recordSignal(userId, { type: 'profile_view' }));
}

export function signalMessageSent(userId: string | undefined): void {
  if (!userId) return;
  safe(() => recordSignal(userId, { type: 'message_sent' }));
}

export function signalEndorsementGiven(userId: string | undefined, skillId: string): void {
  if (!userId) return;
  safe(async () => {
    const skill = await Skill.findById(skillId).select('categoryName skillName').lean();
    if (skill) {
      await recordSignal(userId, { type: 'endorsement_given', category: skill.categoryName, skillName: skill.skillName });
    }
  });
}

type SwapLike = {
  userAId: unknown;
  userBId: unknown;
  userATeachesSkillId: unknown;
  userBTeachesSkillId: unknown;
};

export function signalSwapDeclined(userId: string | undefined, swap: SwapLike | null | undefined): void {
  if (!userId || !swap) return;
  const idOf = (v: unknown): string => {
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object') {
      const id = (v as { _id?: unknown })._id;
      if (typeof id === 'string') return id;
      if (id != null) return String(id);
    }
    return String(v ?? '');
  };
  const catOf = (v: unknown): string | undefined => {
    if (v && typeof v === 'object') return (v as { categoryName?: unknown }).categoryName as string | undefined;
    return undefined;
  };
  const isUserA = idOf(swap.userAId) === userId;
  const offered = isUserA ? swap.userBTeachesSkillId : swap.userATeachesSkillId;
  const category = catOf(offered);
  if (!category) return;
  safe(() => recordSignal(userId, { type: 'swap_declined', category }));
}

export function recordRawSignal(userId: string | undefined, payload: { type: RadarSignalType; category?: string; skillName?: string; format?: string }): void {
  if (!userId) return;
  safe(() => recordSignal(userId, payload));
}
