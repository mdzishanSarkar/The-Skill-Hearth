import { Job } from 'bull';
import { SavedSearch, Skill, User } from '../models';
import { createNotification } from '../services/notification';

export async function processSavedSearchAlert(job: Job): Promise<void> {
  console.log('[Job:SavedSearchAlert] Processing...');

  const searches = await SavedSearch.find({
    alertEnabled: true,
    $or: [
      { lastAlertSentAt: { $exists: false } },
      { lastAlertSentAt: { $lte: new Date(Date.now() - 6 * 60 * 60 * 1000) } },
    ],
  }).populate('userId', 'displayName email status');

  let alertsSent = 0;

  for (const search of searches) {
    const user = search.userId as unknown as { _id: string; status: string };
    if (!user || user.status !== 'active') continue;

    try {
      const filter: Record<string, unknown> = {
        isDeleted: false,
        isActive: true,
        type: 'teach',
      };

      if (search.filters?.category) filter.categoryName = search.filters.category;
      if (search.filters?.format) filter.format = search.filters.format;

      const newCount = await Skill.countDocuments({
        ...filter,
        createdAt: { $gte: search.lastAlertSentAt || new Date(Date.now() - 6 * 60 * 60 * 1000) },
      });

      if (newCount > 0) {
        await createNotification({
          userId: user._id,
          type: 'system_warning',
          message: `${newCount} new skill(s) match your saved search "${search.name || 'Unnamed'}"`,
        });

        search.lastAlertSentAt = new Date();
        await search.save();
        alertsSent++;
      }
    } catch {
      // skip on error
    }
  }

  console.log(`[Job:SavedSearchAlert] Sent ${alertsSent} alerts`);
}
