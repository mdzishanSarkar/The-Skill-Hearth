import { Types } from 'mongoose';
import { Connection, Skill, User } from '../models';
import { HttpError } from '../utils/errors';

export async function getImpact(userId: string | Types.ObjectId) {
  const id = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

  const user = await User.findById(id).select('stats gamification').lean();
  if (!user) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const [taughtAgg, learnerAgg, neighborhoodAgg, skillCount, reviewedAgg] = await Promise.all([
    Connection.aggregate([
      { $match: { teacherId: id, status: 'completed' } },
      {
        $lookup: {
          from: 'skills',
          localField: 'skillId',
          foreignField: '_id',
          as: 'skill',
        },
      },
      { $unwind: { path: '$skill', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          sessionsTaught: { $sum: 1 },
          learnersHelped: { $addToSet: '$requesterId' },
          hoursContributed: {
            $sum: {
              $cond: [
                { $eq: ['$skill.sessionLength', '30min'] },
                0.5,
                { $cond: [{ $eq: ['$skill.sessionLength', '2hr+'] }, 2, 1] },
              ],
            },
          },
        },
      },
    ]),
    Connection.countDocuments({ requesterId: id, status: 'completed' }),
    Skill.distinct('location.neighborhood', {
      userId: id,
      type: 'teach',
      isActive: true,
      isDeleted: false,
      'location.neighborhood': { $ne: '' },
    }),
    Skill.countDocuments({ userId: id, type: 'teach', isActive: true, isDeleted: false }),
    Connection.aggregate([
      { $match: { teacherId: id, status: 'completed' } },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'connectionId',
          as: 'review',
        },
      },
      { $unwind: { path: '$review', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: { $cond: [{ $ne: ['$review', null] }, 1, 0] } },
          ratingSum: { $sum: '$review.rating' },
        },
      },
    ]),
  ]);

  const taught = taughtAgg[0] ?? { sessionsTaught: 0, learnersHelped: [], hoursContributed: 0 };
  const reviewed = reviewedAgg[0] ?? { totalReviews: 0, ratingSum: 0 };

  return {
    teaching: {
      sessionsTaught: taught.sessionsTaught,
      learnersHelped: (taught.learnersHelped as Types.ObjectId[]).length,
      hoursContributed: Math.round((taught.hoursContributed as number) * 10) / 10,
      neighborhoodsReached: neighborhoodAgg.length,
      neighborhoods: neighborhoodAgg.slice(0, 50),
      activeSkills: skillCount,
    },
    learning: {
      sessionsLearned: learnerAgg,
    },
    reviews: {
      totalReviews: reviewed.totalReviews,
      averageRating: reviewed.totalReviews > 0
        ? Math.round((reviewed.ratingSum / reviewed.totalReviews) * 10) / 10
        : user.stats?.averageRating ?? 0,
    },
  };
}
