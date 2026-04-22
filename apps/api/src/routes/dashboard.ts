import { Router } from 'express'
import { desc, eq, inArray } from 'drizzle-orm'
import { postResults, posts, stores, subscriptions } from '@postari/db'
import {
  PLAN_SPECS,
  TOKEN_EXPIRY_WARNING_DAYS,
  currentYearMonthJST,
  type DashboardDTO,
  type Plan,
  type PostDTO,
  type PostResultDTO,
  type Platform,
} from '@postari/shared'
import { db } from '../lib/db'
import { requireAuth } from '../middleware/auth'
import { getUsageForMonth } from '../services/usage'
import { trialStatus } from '../services/trial'

export const dashboardRouter = Router()

dashboardRouter.use(requireAuth)

dashboardRouter.get('/', async (req, res, next) => {
  try {
    const userId = req.auth!.userId
    const [sub, trial, usage, recentPosts, store] = await Promise.all([
      db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, userId) }),
      trialStatus(userId),
      getUsageForMonth(userId),
      db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt)).limit(5),
      db.query.stores.findFirst({
        where: eq(stores.userId, userId),
        columns: { xTokenExpiresAt: true, xUsername: true },
      }),
    ])

    const plan = (sub?.plan as Plan | undefined) ?? null
    const planLimit = plan ? PLAN_SPECS[plan].generateLimit : 0

    // Token warning
    let tokenWarning: DashboardDTO['tokenWarning'] = null
    if (store?.xTokenExpiresAt && store.xUsername) {
      const daysUntil = Math.floor((store.xTokenExpiresAt.getTime() - Date.now()) / 86_400_000)
      if (daysUntil <= TOKEN_EXPIRY_WARNING_DAYS) {
        tokenWarning = { platform: 'x', daysUntilExpiry: daysUntil }
      }
    }

    // Recent posts with results
    const recentIds = recentPosts.map((p) => p.id)
    const results = recentIds.length
      ? await db.select().from(postResults).where(inArray(postResults.postId, recentIds))
      : []
    const byPost = new Map<string, PostResultDTO[]>()
    for (const r of results) {
      const list = byPost.get(r.postId) ?? []
      list.push(resultDTO(r))
      byPost.set(r.postId, list)
    }

    const dto: DashboardDTO = {
      plan: plan ?? 'trial',
      subscription: sub
        ? {
            plan: sub.plan as Plan,
            billingInterval: sub.billingInterval as 'month' | 'year',
            status: sub.status as 'active' | 'past_due' | 'canceled' | 'incomplete',
            currentPeriodStart: sub.currentPeriodStart.toISOString(),
            currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          }
        : null,
      trial,
      usage: {
        yearMonth: currentYearMonthJST(),
        postCount: usage.postCount,
        generateCount: usage.generateCount,
        overageCount: usage.overageCount,
        limit: planLimit,
      },
      tokenWarning,
      recentPosts: recentPosts.map((p) => postDTO(p, byPost.get(p.id) ?? [])),
    }
    res.json(dto)
  } catch (err) {
    next(err)
  }
})

function postDTO(p: typeof posts.$inferSelect, results: PostResultDTO[]): PostDTO {
  return {
    id: p.id,
    storeId: p.storeId,
    status: p.status as PostDTO['status'],
    isTrial: p.isTrial,
    imageUrls: p.imageUrls,
    hint: p.hint,
    generatedForX: p.generatedForX,
    editedForX: p.editedForX,
    generatedForGoogle: p.generatedForGoogle,
    generatedForInstagram: p.generatedForInstagram,
    generatedForWp: p.generatedForWp,
    results,
    createdAt: p.createdAt.toISOString(),
    publishedAt: p.publishedAt?.toISOString() ?? null,
  }
}

function resultDTO(r: typeof postResults.$inferSelect): PostResultDTO {
  return {
    id: r.id,
    platform: r.platform as Platform,
    status: r.status as PostResultDTO['status'],
    externalId: r.externalId,
    externalUrl: r.externalUrl,
    errorCode: r.errorCode,
    errorMessage: r.errorMessage,
    attemptedAt: r.attemptedAt.toISOString(),
  }
}
