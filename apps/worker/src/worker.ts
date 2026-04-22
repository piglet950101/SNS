import * as Sentry from '@sentry/node'
import { Queue, Worker } from 'bullmq'
import { QUEUES } from '@postari/shared'
import { env } from './env'
import { logger } from './lib/logger'
import { redis } from './lib/redis'
import { processPostX, type PostXJobData } from './jobs/post-x'
import { processTokenRefreshX, type TokenRefreshJobData } from './jobs/token-refresh-x'
import { processNotifyTokenExpired, type NotifyTokenExpiredData } from './jobs/notify-token-expired'
import { slackAlert } from './lib/slack'

const e = env()

if (e.SENTRY_DSN_WORKER) {
  Sentry.init({ dsn: e.SENTRY_DSN_WORKER, environment: e.NODE_ENV, tracesSampleRate: 0.1 })
}

const notifyQueue = new Queue(QUEUES.NOTIFY_TOKEN_EXPIRED, { connection: redis })
const enqueueNotify = async (userId: string, platform: string) => {
  await notifyQueue.add(
    QUEUES.NOTIFY_TOKEN_EXPIRED,
    { userId, platform },
    { jobId: `notify-${userId}-${platform}-${Date.now()}` },
  )
}

// post:x
const postXWorker = new Worker<PostXJobData>(
  QUEUES.POST_X,
  async (job) => processPostX(job.data, enqueueNotify),
  { connection: redis, concurrency: 5 },
)

// token:refresh:x
const tokenRefreshWorker = new Worker<TokenRefreshJobData>(
  QUEUES.TOKEN_REFRESH_X,
  async (job) => processTokenRefreshX(job.data, enqueueNotify),
  { connection: redis, concurrency: 5 },
)

// notify:token:expired
const notifyWorker = new Worker<NotifyTokenExpiredData>(
  QUEUES.NOTIFY_TOKEN_EXPIRED,
  async (job) => processNotifyTokenExpired(job.data),
  { connection: redis, concurrency: 5 },
)

const workers = [postXWorker, tokenRefreshWorker, notifyWorker]
for (const w of workers) {
  w.on('completed', (job) => {
    logger.info({ queue: w.name, jobId: job.id }, 'job completed')
  })
  w.on('failed', (job, err) => {
    logger.error({ queue: w.name, jobId: job?.id, err }, 'job failed')
    Sentry.captureException(err)
    void slackAlert(`:warning: ${w.name} job failed — ${err.message}`)
  })
  w.on('error', (err) => {
    logger.error({ queue: w.name, err }, 'worker error')
    Sentry.captureException(err)
  })
}

logger.info({ queues: workers.map((w) => w.name) }, 'postari-worker listening')

async function shutdown(signal: string) {
  logger.info({ signal }, 'worker shutting down')
  await Promise.all(workers.map((w) => w.close()))
  await notifyQueue.close()
  await redis.quit()
  process.exit(0)
}
process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
