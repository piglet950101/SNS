import { Queue } from 'bullmq'
import { QUEUES } from '@postari/shared'
import { redis } from './redis'

function q(name: string) {
  return new Queue(name, {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: { count: 1_000, age: 60 * 60 * 24 * 7 },
      removeOnFail: { count: 5_000, age: 60 * 60 * 24 * 30 },
    },
  })
}

export const queues = {
  postX: q(QUEUES.POST_X),
  tokenRefreshX: q(QUEUES.TOKEN_REFRESH_X),
  notifyTokenExpired: q(QUEUES.NOTIFY_TOKEN_EXPIRED),
  cleanupRetention: q(QUEUES.CLEANUP_RETENTION),
}

export type Queues = typeof queues
