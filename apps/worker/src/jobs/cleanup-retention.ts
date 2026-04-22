import { and, isNotNull, lt, sql } from 'drizzle-orm'
import { dataRetentionCleanup, posts, users } from '@postari/db'
import { SOFT_DELETE_RETENTION_DAYS } from '@postari/shared'
import { db } from '../lib/db'
import { logger } from '../lib/logger'

/**
 * Daily retention cleanup:
 *   - Purge users.deletedAt > 90 days ago (cascade deletes stores/posts).
 *   - Per PP第7条, we retain post_results for statutory periods via cascade
 *     audit, so cascade here is fine.
 *   - Log each deletion to data_retention_cleanup.
 */
export async function runCleanupRetention(): Promise<void> {
  const cutoff = new Date(Date.now() - SOFT_DELETE_RETENTION_DAYS * 86_400_000)

  const toDelete = await db
    .select({ id: users.id })
    .from(users)
    .where(and(isNotNull(users.deletedAt), lt(users.deletedAt, cutoff)))

  logger.info({ count: toDelete.length }, 'retention cleanup — users to purge')

  for (const u of toDelete) {
    await db.transaction(async (tx) => {
      await tx.insert(dataRetentionCleanup).values({
        targetTable: 'users',
        targetId: u.id,
        action: 'deleted_after_withdrawal',
      })
      await tx.delete(users).where(sql`${users.id} = ${u.id}`)
    })
  }

  // Posts for deleted users will cascade-delete. Nothing to do for orphans.

  logger.info('retention cleanup complete')
}

// Allow running standalone as a Render Cron Job.
if (process.argv[1]?.endsWith('cleanup-retention.ts') || process.argv[1]?.endsWith('cleanup-retention.js')) {
  runCleanupRetention()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, 'cleanup-retention failed')
      process.exit(1)
    })
}
