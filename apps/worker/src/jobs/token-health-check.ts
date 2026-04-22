import { Queue } from 'bullmq'
import { and, gt, isNotNull, lt } from 'drizzle-orm'
import { stores } from '@postari/db'
import { QUEUES, TOKEN_EXPIRY_WARNING_DAYS } from '@postari/shared'
import { db } from '../lib/db'
import { redis } from '../lib/redis'
import { logger } from '../lib/logger'

/**
 * Daily cron: find stores whose X token expires within
 * TOKEN_EXPIRY_WARNING_DAYS and enqueue an email notification. Actual
 * refreshing happens just-in-time in the post:x job; this is purely the
 * user-facing warning.
 */
export async function runTokenHealthCheck(): Promise<void> {
  const now = new Date()
  const warnBy = new Date(now.getTime() + TOKEN_EXPIRY_WARNING_DAYS * 86_400_000)

  const atRisk = await db
    .select({
      userId: stores.userId,
      storeId: stores.id,
      expiresAt: stores.xTokenExpiresAt,
    })
    .from(stores)
    .where(
      and(
        isNotNull(stores.xTokenExpiresAt),
        isNotNull(stores.xAccessToken),
        gt(stores.xTokenExpiresAt, now),
        lt(stores.xTokenExpiresAt, warnBy),
      ),
    )

  logger.info({ count: atRisk.length }, 'token-health: at-risk stores')

  const notifyQueue = new Queue(QUEUES.NOTIFY_TOKEN_EXPIRED, { connection: redis })
  try {
    for (const row of atRisk) {
      await notifyQueue.add(
        QUEUES.NOTIFY_TOKEN_EXPIRED,
        { userId: row.userId, platform: 'x' },
        { jobId: `notify-expiring-${row.storeId}-${row.expiresAt?.toISOString()}` },
      )
    }
  } finally {
    await notifyQueue.close()
  }
}

if (process.argv[1]?.endsWith('token-health-check.ts') || process.argv[1]?.endsWith('token-health-check.js')) {
  runTokenHealthCheck()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, 'token-health failed')
      process.exit(1)
    })
}
