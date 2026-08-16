import { Job } from 'bull';
import { User } from '../models';
import { recomputeMatchesForUser } from '../services/swapReadyMatch.service';

export async function processSwapReadyMatch(job: Job): Promise<void> {
  console.log('[Job:SwapReadyMatch] Processing...');

  const users = await User.find({
    status: 'active',
    isShadowBanned: false,
  }).select('_id');

  let processed = 0;
  for (const user of users) {
    try {
      await recomputeMatchesForUser(String(user._id));
      processed++;
    } catch (err) {
      console.error(`[Job:SwapReadyMatch] Error for user ${String(user._id)}:`, err);
    }
  }

  console.log(`[Job:SwapReadyMatch] Recomputed matches for ${processed} users`);
}
