import { Job } from 'bull';
import { User, Skill, SkillSwap } from '../models';
import { createNotification } from '../services/notification';

export async function processSkillSwapMatch(job: Job): Promise<void> {
  console.log('[Job:SkillSwapMatch] Processing...');

  const users = await User.find({
    status: 'active',
    isShadowBanned: false,
  }).select('displayName');

  let matchesFound = 0;

  for (const userA of users) {
    try {
      const skillsA = await Skill.find({
        userId: userA._id,
        type: 'teach',
        isDeleted: false,
        isActive: true,
      }).select('skillName categoryName');

      const learnA = await Skill.find({
        userId: userA._id,
        type: 'learn',
        isDeleted: false,
      }).select('skillName categoryName');

      if (skillsA.length === 0 || learnA.length === 0) continue;

      for (const teachSkill of skillsA) {
        for (const learnSkill of learnA) {
          const potentialMatches = await Skill.find({
            type: 'teach',
            skillName: learnSkill.skillName,
            isDeleted: false,
            isActive: true,
            userId: { $ne: userA._id },
          }).select('userId skillName');

          for (const match of potentialMatches) {
            const userB = await User.findById(match.userId).select('status isShadowBanned');
            if (!userB || userB.status !== 'active' || userB.isShadowBanned) continue;

            const userBSkills = await Skill.find({
              userId: match.userId,
              type: 'teach',
              isDeleted: false,
              isActive: true,
              skillName: teachSkill.skillName,
            });

            if (userBSkills.length === 0) continue;

            const existingSwap = await SkillSwap.findOne({
              $or: [
                { userAId: userA._id, userBId: match.userId },
                { userAId: match.userId, userBId: userA._id },
              ],
              status: { $ne: 'declined' },
            });

            if (existingSwap) continue;

            await SkillSwap.create({
              userAId: userA._id,
              userBId: match.userId,
              userATeachesSkillId: teachSkill._id,
              userBTeachesSkillId: userBSkills[0]._id,
              status: 'suggested',
            });

            await createNotification({
              userId: userA._id,
              type: 'system_warning',
              message: `New skill swap suggestion: Teach ${teachSkill.skillName}, Learn ${learnSkill.skillName}`,
            });

            matchesFound++;
          }
        }
      }
    } catch {
      // skip user on error
    }
  }

  console.log(`[Job:SkillSwapMatch] Found ${matchesFound} new matches`);
}
