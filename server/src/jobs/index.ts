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
  savedSearchAlert: Queue.Queue;
  skillSwapMatch: Queue.Queue;
  reviewAggregation: Queue.Queue;
  tokenCleanup: Queue.Queue;
}

let queues: JobQueues | null = null;

export async function getQueues(): Promise<JobQueues | null> {
  if (queues) return queues;

  const conn = await getBullConnection();
  if (!conn) return null;

  queues = {
    emailDigest: conn,
    savedSearchAlert: conn,
    skillSwapMatch: conn,
    reviewAggregation: conn,
    tokenCleanup: conn,
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
  const { processSavedSearchAlert } = await import('../jobs/savedSearchAlert.job');
  const { processSkillSwapMatch } = await import('../jobs/skillSwapMatch.job');
  const { processReviewAggregation } = await import('../jobs/reviewAggregation.job');
  const { processTokenCleanup } = await import('../jobs/tokenCleanup.job');

  q.emailDigest.process('emailDigest', 5, processEmailDigest);
  q.savedSearchAlert.process('savedSearchAlert', 10, processSavedSearchAlert);
  q.skillSwapMatch.process('skillSwapMatch', 5, processSkillSwapMatch);
  q.reviewAggregation.process('reviewAggregation', 10, processReviewAggregation);
  q.tokenCleanup.process('tokenCleanup', 20, processTokenCleanup);

  console.log('[Jobs] All job processors registered');
}

export async function scheduleRecurringJobs(): Promise<void> {
  const q = await getQueues();
  if (!q) return;

  await q.emailDigest.add('emailDigest', {}, {
    repeat: { cron: '0 9 * * 1' },
    removeOnComplete: true,
  });

  await q.savedSearchAlert.add('savedSearchAlert', {}, {
    repeat: { cron: '0 */6 * * *' },
    removeOnComplete: true,
  });

  await q.skillSwapMatch.add('skillSwapMatch', {}, {
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

  console.log('[Jobs] Recurring jobs scheduled');
}
