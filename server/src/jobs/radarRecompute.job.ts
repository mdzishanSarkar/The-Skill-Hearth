import { Job } from 'bull';
import { recomputeIntents, getActiveUserIds } from '../services/skillRadar.service';

const BATCH_SIZE = 50;

export async function processRadarRecompute(_job: Job): Promise<void> {
  const userIds = await getActiveUserIds();
  console.log(`[Job:RadarRecompute] Recomputing intents for ${userIds.length} active users`);

  let errors = 0;
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (userId) => {
        try {
          await recomputeIntents(userId);
        } catch (err) {
          errors++;
          console.error(`[Job:RadarRecompute] Error for user ${userId}:`, err);
        }
      })
    );
  }

  console.log(`[Job:RadarRecompute] Done. ${errors} user(s) errored`);
}
