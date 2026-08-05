import { User, Skill, Connection, Message, Review, Endorsement, SkillSwap, Notification, OAuthProvider, TwoFactorSecret, SkillSuggestion, SkillBundle, BlockOutDate } from '../models';

export async function exportUserData(userId: string) {
  const [
    user,
    skills,
    connections,
    messages,
    reviews,
    endorsements,
    swaps,
    notifications,
    oauthProviders,
    twoFactor,
    suggestions,
    bundles,
    blockOutDates,
  ] = await Promise.all([
    User.findById(userId).select('-passwordHash -__v').lean(),
    Skill.find({ userId }).select('-__v').lean(),
    Connection.find({ $or: [{ requesterId: userId }, { teacherId: userId }] }).select('-__v').lean(),
    Message.find({ $or: [{ senderId: userId }, { receiverId: userId }] }).select('-__v').lean(),
    Review.find({ reviewerId: userId }).select('-__v').lean(),
    Endorsement.find({ $or: [{ endorserId: userId }, { endorseeId: userId }] }).select('-__v').lean(),
    SkillSwap.find({ $or: [{ userAId: userId }, { userBId: userId }] }).select('-__v').lean(),
    Notification.find({ userId }).select('-__v').lean(),
    OAuthProvider.find({ userId }).select('-__v').lean(),
    TwoFactorSecret.findOne({ userId }).select('-secret -__v').lean(),
    SkillSuggestion.find({ userId }).select('-__v').lean(),
    SkillBundle.find({ createdBy: userId }).select('-__v').lean(),
    BlockOutDate.find({ userId }).select('-__v').lean(),
  ]);

  return {
    exportDate: new Date().toISOString(),
    user,
    skills,
    connections,
    messages,
    reviews,
    endorsements,
    swaps,
    notifications,
    oauthProviders,
    twoFactor: twoFactor ? { enabled: twoFactor.enabled, lastUsedAt: twoFactor.lastUsedAt } : null,
    suggestions,
    bundles,
    blockOutDates,
  };
}

export async function deleteUserAccount(userId: string) {
  const user = await User.findById(userId);
  if (!user) return;

  await Promise.all([
    Skill.deleteMany({ userId }),
    Connection.deleteMany({ $or: [{ requesterId: userId }, { teacherId: userId }] }),
    Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] }),
    Review.deleteMany({ $or: [{ reviewerId: userId }, { revieweeId: userId }] }),
    Endorsement.deleteMany({ $or: [{ endorserId: userId }, { endorseeId: userId }] }),
    SkillSwap.deleteMany({ $or: [{ userAId: userId }, { userBId: userId }] }),
    Notification.deleteMany({ userId }),
    OAuthProvider.deleteMany({ userId }),
    TwoFactorSecret.deleteMany({ userId }),
    SkillSuggestion.deleteMany({ userId }),
    SkillBundle.deleteMany({ createdBy: userId }),
    BlockOutDate.deleteMany({ userId }),
  ]);

  await user.deleteOne();
}
