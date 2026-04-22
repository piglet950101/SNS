import { and, eq, sql } from 'drizzle-orm'
import { usageLogs } from '@postari/db'
import { currentYearMonthJST } from '@postari/shared'
import { db } from '../lib/db'

/**
 * Atomically upsert the current month's usage_logs row and increment the
 * requested counter. Safe against concurrent increments because
 * ON CONFLICT DO UPDATE is atomic within a single Postgres statement.
 */
export async function incrementCounter(
  userId: string,
  field: 'generateCount' | 'postCount' | 'overageCount',
  by = 1,
): Promise<void> {
  const yearMonth = currentYearMonthJST()
  const now = new Date()
  const zero = { generateCount: 0, postCount: 0, overageCount: 0 }

  switch (field) {
    case 'generateCount':
      await db
        .insert(usageLogs)
        .values({ userId, yearMonth, ...zero, generateCount: by })
        .onConflictDoUpdate({
          target: [usageLogs.userId, usageLogs.yearMonth],
          set: {
            generateCount: sql`${usageLogs.generateCount} + ${by}`,
            updatedAt: now,
          },
        })
      return
    case 'postCount':
      await db
        .insert(usageLogs)
        .values({ userId, yearMonth, ...zero, postCount: by })
        .onConflictDoUpdate({
          target: [usageLogs.userId, usageLogs.yearMonth],
          set: {
            postCount: sql`${usageLogs.postCount} + ${by}`,
            updatedAt: now,
          },
        })
      return
    case 'overageCount':
      await db
        .insert(usageLogs)
        .values({ userId, yearMonth, ...zero, overageCount: by })
        .onConflictDoUpdate({
          target: [usageLogs.userId, usageLogs.yearMonth],
          set: {
            overageCount: sql`${usageLogs.overageCount} + ${by}`,
            updatedAt: now,
          },
        })
      return
  }
}

export async function getUsageForMonth(userId: string, yearMonth = currentYearMonthJST()) {
  const row = await db.query.usageLogs.findFirst({
    where: and(eq(usageLogs.userId, userId), eq(usageLogs.yearMonth, yearMonth)),
  })
  return (
    row ?? {
      userId,
      yearMonth,
      generateCount: 0,
      postCount: 0,
      overageCount: 0,
    }
  )
}

/**
 * Sum all-time generations for the user. Trial gate compares against this
 * lifetime total so a user can't wait out the month to get a fresh 3 tries.
 */
export async function getLifetimeGenerationCount(userId: string): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${usageLogs.generateCount}), 0)::int`,
    })
    .from(usageLogs)
    .where(eq(usageLogs.userId, userId))
  return row?.total ?? 0
}
