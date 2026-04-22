import { Router } from 'express'
import { sql } from 'drizzle-orm'
import { db } from '../lib/db'
import { redis } from '../lib/redis'

export const healthRouter = Router()

healthRouter.get('/', async (_req, res) => {
  const version = process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? 'dev'
  let dbOk = false
  let redisOk = false
  try {
    await db.execute(sql`select 1`)
    dbOk = true
  } catch {
    dbOk = false
  }
  try {
    const pong = await redis.ping()
    redisOk = pong === 'PONG'
  } catch {
    redisOk = false
  }
  const status = dbOk && redisOk ? 'ok' : 'degraded'
  res.status(status === 'ok' ? 200 : 503).json({
    status,
    version,
    time: new Date().toISOString(),
    checks: { db: dbOk, redis: redisOk },
  })
})
