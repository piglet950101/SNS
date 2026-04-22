import IORedis from 'ioredis'
import { env } from '../env'

// BullMQ requires maxRetriesPerRequest: null
export const redis = new IORedis(env().REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
})
