import { Job } from 'bull';
import { User, Connection } from '../models';

export async function processEmailDigest(job: Job): Promise<void> {
  console.log('[Job:EmailDigest] Processing...');

  const users = await User.find({
    isEmailVerified: true,
    status: 'active',
    'location.city': { $exists: true, $ne: '' },
  }).select('email displayName location');

  let sent = 0;

  for (const user of users) {
    try {
      const recentConnections = await Connection.countDocuments({
        $or: [
          { requesterId: user._id },
          { teacherId: user._id },
        ],
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });

      const pendingRequests = await Connection.countDocuments({
        teacherId: user._id,
        status: 'pending',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });

      if (recentConnections === 0 && pendingRequests === 0) continue;

      // Log digest info - in production, integrate with email service
      console.log(
        `[EmailDigest] User: ${user.displayName} | ` +
        `Connections: ${recentConnections} | Pending: ${pendingRequests}`
      );
      sent++;
    } catch {
      // skip user on error
    }
  }

  console.log(`[Job:EmailDigest] Processed ${sent} users`);
}
