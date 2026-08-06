import { Job } from 'bull';
import { RefreshToken, EmailVerificationToken, PasswordResetToken } from '../models';

export async function processTokenCleanup(job: Job): Promise<void> {
  console.log('[Job:TokenCleanup] Processing...');

  const now = new Date();

  const refreshResult = await RefreshToken.deleteMany({
    $or: [
      { expiresAt: { $lt: now } },
      { revokedAt: { $ne: null, $lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
    ],
  });

  const emailResult = await EmailVerificationToken.deleteMany({
    $or: [
      { expiresAt: { $lt: now } },
      { usedAt: { $ne: null } },
    ],
  });

  const passwordResult = await PasswordResetToken.deleteMany({
    $or: [
      { expiresAt: { $lt: now } },
      { usedAt: { $ne: null } },
    ],
  });

  console.log(
    `[Job:TokenCleanup] Removed ${refreshResult.deletedCount} refresh tokens, ` +
    `${emailResult.deletedCount} email tokens, ${passwordResult.deletedCount} password tokens`
  );
}
