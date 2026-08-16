import Queue from 'bull';

let connection: any = null;

async function getBullConnection() {
  if (connection) return connection;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  connection = new Queue('default', {
    redis: redisUrl,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    },
  });

  return connection;
}

export interface JobQueues {
  emailDigest: Queue.Queue;
  weeklyDigest: Queue.Queue;
  radarCatchup: Queue.Queue;
  swapReadyMatch: Queue.Queue;
  reviewAggregation: Queue.Queue;
  tokenCleanup: Queue.Queue;
  radarRecompute: Queue.Queue;
  skillDemand: Queue.Queue;
}

let queues: JobQueues | null = null;

export async function getQueues(): Promise<JobQueues | null> {
  if (queues) return queues;

  const conn = await getBullConnection();
  if (!conn) return null;

  queues = {
    emailDigest: conn,
    weeklyDigest: conn,
    radarCatchup: conn,
    swapReadyMatch: conn,
    reviewAggregation: conn,
    tokenCleanup: conn,
    radarRecompute: conn,
    skillDemand: conn,
  };

  return queues;
}

export async function addJob(queueName: string, data: Record<string, unknown>, opts?: Queue.JobOptions) {
  const q = await getQueues();
  if (!q) return null;

  const queue = (q as any)[queueName] as Queue.Queue | undefined;
  if (!queue) return null;

  return queue.add(queueName, data, opts);
}

export async function startAllJobs(): Promise<void> {
  const q = await getQueues();
  if (!q) {
    console.log('[Jobs] Redis unavailable, jobs disabled');
    return;
  }

  const { processEmailDigest } = await import('../jobs/emailDigest.job');
  const { processWeeklyDigest } = await import('../jobs/weeklyDigest.job');
  const { processRadarCatchup } = await import('../jobs/radarCatchup.job');
  const { processSwapReadyMatch } = await import('../jobs/swapReadyMatch.job');
  const { processReviewAggregation } = await import('../jobs/reviewAggregation.job');
  const { processTokenCleanup } = await import('../jobs/tokenCleanup.job');
  const { processRadarRecompute } = await import('../jobs/radarRecompute.job');
  const { processSkillDemand } = await import('../jobs/skillDemand.job');

  q.emailDigest.process('emailDigest', 5, processEmailDigest);
  q.weeklyDigest.process('weeklyDigest', 10, processWeeklyDigest);
  q.radarCatchup.process('radarCatchup', 10, processRadarCatchup);
  q.swapReadyMatch.process('swapReadyMatch', 5, processSwapReadyMatch);
  q.reviewAggregation.process('reviewAggregation', 10, processReviewAggregation);
  q.tokenCleanup.process('tokenCleanup', 20, processTokenCleanup);
  q.radarRecompute.process('radarRecompute', 5, processRadarRecompute);
  q.skillDemand.process('skillDemand', 5, processSkillDemand);

  console.log('[Jobs] All job processors registered');
}

export async function scheduleRecurringJobs(): Promise<void> {
  const q = await getQueues();
  if (!q) return;

  // Remove legacy repeat jobs for the old saved-search alert queue (renamed to radarCatchup)
  // and the old skill-swap matcher (replaced by swapReadyMatch).
  try {
    const repeatables = await q.emailDigest.getRepeatableJobs();
    for (const r of repeatables) {
      if (String(r.name).startsWith('savedSearchAlert') || String(r.name).startsWith('skillSwapMatch')) {
        await q.emailDigest.removeRepeatableByKey(r.key);
      }
    }
  } catch {
    // ignore
  }

  await q.emailDigest.add('emailDigest', {}, {
    repeat: { cron: '0 9 * * 1' },
    removeOnComplete: true,
  });

  await q.weeklyDigest.add('weeklyDigest', {}, {
    repeat: { cron: '0 8 * * 1' },
    removeOnComplete: true,
  });

  await q.radarCatchup.add('radarCatchup', {}, {
    repeat: { cron: '0 */6 * * *' },
    removeOnComplete: true,
  });

  await q.swapReadyMatch.add('swapReadyMatch', {}, {
    repeat: { cron: '0 0 * * 0' },
    removeOnComplete: true,
  });

  await q.reviewAggregation.add('reviewAggregation', {}, {
    repeat: { cron: '0 2 * * *' },
    removeOnComplete: true,
  });

  await q.tokenCleanup.add('tokenCleanup', {}, {
    repeat: { cron: '0 3 * * *' },
    removeOnComplete: true,
  });

  await q.radarRecompute.add('radarRecompute', {}, {
    repeat: { cron: '0 */4 * * *' },
    removeOnComplete: true,
  });

  await q.skillDemand.add('skillDemand', {}, {
    repeat: { cron: '0 1 * * 1' },
    removeOnComplete: true,
  });

  console.log('[Jobs] Recurring jobs scheduled');
}
