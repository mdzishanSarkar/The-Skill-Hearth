import { Job } from 'bull';
import { User, Skill, Review } from '../models';

export async function processReviewAggregation(job: Job): Promise<void> {
  console.log('[Job:ReviewAggregation] Processing...');

  let usersUpdated = 0;
  let skillsUpdated = 0;

  const usersWithReviews = await Review.distinct('revieweeId');
  for (const userId of usersWithReviews) {
    try {
      const result = await Review.aggregate([
        { $match: { revieweeId: userId } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);

      const stats = result[0] || { avg: 0, count: 0 };
      await User.findByIdAndUpdate(userId, {
        $set: {
          'stats.averageRating': Math.round(stats.avg * 10) / 10,
          'stats.reviewCount': stats.count,
        },
      });
      usersUpdated++;
    } catch {
      // skip
    }
  }

  const skillsWithReviews = await Review.distinct('skillId');
  for (const skillId of skillsWithReviews) {
    try {
      const result = await Review.aggregate([
        { $match: { skillId } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);

      const stats = result[0] || { avg: 0, count: 0 };
      await Skill.findByIdAndUpdate(skillId, {
        $set: {
          'stats.averageRating': Math.round(stats.avg * 10) / 10,
          'stats.reviewCount': stats.count,
        },
      });
      skillsUpdated++;
    } catch {
      // skip
    }
  }

  console.log(`[Job:ReviewAggregation] Updated ${usersUpdated} users, ${skillsUpdated} skills`);
}
