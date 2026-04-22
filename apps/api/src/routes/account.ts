import { Router } from 'express'
import { eq, inArray } from 'drizzle-orm'
import { postResults, posts, stores, subscriptions, users } from '@postari/db'
import { db } from '../lib/db'
import { requireAuth } from '../middleware/auth'
import { notFound } from '../lib/errors'
import { logger } from '../lib/logger'

export const accountRouter = Router()

accountRouter.use(requireAuth)

accountRouter.post('/request-deletion', async (req, res, next) => {
  try {
    await db
      .update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, req.auth!.userId))
    logger.info({ userId: req.auth!.userId }, 'account deletion requested (soft)')
    res.json({ ok: true, purgeAfterDays: 90 })
  } catch (err) {
    next(err)
  }
})

// GDPR-style data export (PP 第8条)
accountRouter.get('/export', async (req, res, next) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.auth!.userId),
    })
    if (!user) throw notFound()

    const [userStores, userPosts, userSub] = await Promise.all([
      db.select().from(stores).where(eq(stores.userId, user.id)),
      db.select().from(posts).where(eq(posts.userId, user.id)),
      db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, user.id) }),
    ])

    const userResults = userPosts.length
      ? await db
          .select()
          .from(postResults)
          .where(inArray(postResults.postId, userPosts.map((p) => p.id)))
      : []

    // Redact encrypted token columns from export
    const safeStores = userStores.map((s) => ({
      ...s,
      xAccessToken: null,
      xRefreshToken: null,
      googleAccessToken: null,
      googleRefreshToken: null,
      wpAppPassword: null,
      igAccessToken: null,
    }))

    res.setHeader('Content-Disposition', `attachment; filename="postari-export-${user.id}.json"`)
    res.json({
      exportedAt: new Date().toISOString(),
      user: { ...user, clerkId: '[redacted]' },
      stores: safeStores,
      posts: userPosts,
      postResults: userResults,
      subscription: userSub ?? null,
    })
  } catch (err) {
    next(err)
  }
})
