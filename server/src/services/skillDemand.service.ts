import { Skill, SkillDemandSnapshot } from '../models';

const WINDOW_DAYS = 30;
const TOP_SKILLS = 50;
const TOP_REGIONS = 3;
const KEEP_SNAPSHOTS = 10;

/**
 * Aggregate learn skills created in the last 30 days (from active, non-shadow-banned
 * users) into a demand snapshot, ranked by number of learners with the top
 * neighborhoods per skill. Saves a new snapshot and prunes old ones.
 */
export async function computeAndSaveSnapshot(): Promise<InstanceType<typeof SkillDemandSnapshot>> {
  const windowEnd = new Date();
  const windowStart = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const rows = await Skill.aggregate([
    { $match: { type: 'learn', isDeleted: false, createdAt: { $gte: windowStart } } },
    {
      $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'learner' },
    },
    { $unwind: { path: '$learner', preserveNullAndEmptyArrays: false } },
    { $match: { 'learner.status': 'active', 'learner.isShadowBanned': { $ne: true } } },
    {
      $group: {
        _id: { skillName: '$skillName', categoryName: '$categoryName' },
        demandScore: { $sum: 1 },
        regions: {
          $push: {
            $ifNull: ['$location.neighborhood', '$location.city', 'Other'],
          },
        },
      },
    },
    { $sort: { demandScore: -1, '_id.skillName': 1 } },
    { $limit: TOP_SKILLS },
  ]);

  const skills = rows.map((row) => {
    const regionCounts = new Map<string, number>();
    for (const region of row.regions as string[]) {
      const name = String(region).trim() || 'Other';
      regionCounts.set(name, (regionCounts.get(name) ?? 0) + 1);
    }
    const topRegions = [...regionCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_REGIONS);

    return {
      skillName: (row._id as { skillName: string }).skillName,
      categoryName: (row._id as { categoryName: string }).categoryName,
      demandScore: row.demandScore as number,
      topRegions,
    };
  });

  const snapshot = await SkillDemandSnapshot.create({ skills, windowStart, windowEnd });

  // Prune old snapshots, keeping the most recent KEEP_SNAPSHOTS.
  const old = await SkillDemandSnapshot.find()
    .sort({ createdAt: -1 })
    .skip(KEEP_SNAPSHOTS)
    .select('_id')
    .lean();
  if (old.length) {
    await SkillDemandSnapshot.deleteMany({ _id: { $in: old.map((s) => s._id) } });
  }

  return snapshot;
}

/** Latest snapshot, or a freshly computed one if none exists yet. */
export async function getLatestSnapshot() {
  const latest = await SkillDemandSnapshot.findOne().sort({ createdAt: -1 }).lean();
  if (latest) return latest;
  return computeAndSaveSnapshot();
}
