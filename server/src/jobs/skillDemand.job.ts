import { Job } from 'bull';
import { computeAndSaveSnapshot } from '../services/skillDemand.service';

export async function processSkillDemand(job: Job): Promise<void> {
  console.log('[Job:SkillDemand] Computing demand snapshot...');
  const snapshot = await computeAndSaveSnapshot();
  console.log(`[Job:SkillDemand] Snapshot saved with ${snapshot.skills.length} skills`);
}
