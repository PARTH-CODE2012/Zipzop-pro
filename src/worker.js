import IORedis from 'ioredis';
import { Worker } from 'bullmq';

function createWorkerConnection() {
  const redisUrl = process.env.REDIS_URL ||
    (process.env.REDIS_HOST ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` : null);

  if (!redisUrl) {
    console.warn('REDIS not configured: Worker will not start.');
    return null;
  }

  const conn = new IORedis(redisUrl, {
    retryStrategy: (times) => Math.min(2000, 50 * times),
    maxRetriesPerRequest: null,
  });

  conn.on('error', (err) => console.error('[ioredis] worker error', err && err.message ? err.message : err));
  conn.on('connect', () => console.log('Worker: redis connected'));
  conn.on('ready', () => console.log('Worker: redis ready'));
  return conn;
}

const connection = createWorkerConnection();

if (connection) {
  const worker = new Worker('video-processing', async (job) => {
    // existing job handler...
  }, { connection });

  worker.on('completed', (job) => console.log('Job completed', job.id));
  worker.on('failed', (job, err) => console.error('Job failed', job.id, err));
} else {
  console.warn('Video worker disabled because Redis is not configured.');
}
