import { and, eq, sql } from 'drizzle-orm'
import { postResults, posts, stores, subscriptions, usageLogs, users } from '@postari/db'
import {
  PLAN_SPECS,
  POST_STATUS,
  currentYearMonthJST,
  type Plan,
} from '@postari/shared'
import { db } from '../lib/db'
import { decrypt, encrypt } from '../lib/encryption'
import { logger } from '../lib/logger'
import { postTweet, refreshAccessToken, tweetUrl, uploadMediaFromUrl } from '../lib/x'
import { stripe } from '../lib/stripe'

export interface PostXJobData {
  postId: string
}

const REFRESH_THRESHOLD_MS = 7 * 86_400_000 // 7 days

export async function processPostX(
  data: PostXJobData,
  enqueueNotify: (userId: string, platform: string) => Promise<void>,
): Promise<void> {
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, data.postId),
  })
  if (!post) throw new Error(`post not found: ${data.postId}`)
  const store = await db.query.stores.findFirst({ where: eq(stores.id, post.storeId) })
  if (!store) throw new Error(`store not found: ${post.storeId}`)

  if (!store.xAccessToken || !store.xRefreshToken) {
    await recordFailure(post.id, 'NO_X_CONNECTION', 'X 連携がありません')
    await markPostFailed(post.id)
    return
  }

  // Refresh proactively if near expiry
  let accessToken = decrypt(store.xAccessToken)
  if (
    store.xTokenExpiresAt &&
    store.xTokenExpiresAt.getTime() - Date.now() < REFRESH_THRESHOLD_MS
  ) {
    try {
      accessToken = await refreshAndPersist(store.id, store.xRefreshToken)
    } catch (err) {
      logger.warn({ err, storeId: store.id }, 'proactive refresh failed — trying anyway')
    }
  }

  const textToPost = (post.editedForX ?? post.generatedForX ?? '').trim()
  if (!textToPost) {
    await recordFailure(post.id, 'EMPTY_TEXT', '投稿文が空です')
    await markPostFailed(post.id)
    return
  }

  // Upload media (up to 4)
  let mediaIds: string[] = []
  try {
    mediaIds = await Promise.all(
      (post.imageUrls ?? []).slice(0, 4).map((url) => uploadMediaFromUrl(accessToken, url)),
    )
  } catch (err) {
    logger.warn({ err, postId: post.id }, 'media upload failed — posting text-only')
    mediaIds = []
  }

  try {
    const result = await postTweet(accessToken, textToPost, mediaIds)
    await recordSuccess(post.id, result.tweetId, tweetUrl(result.username, result.tweetId))
    await db
      .update(posts)
      .set({ status: POST_STATUS.POSTED, publishedAt: new Date() })
      .where(eq(posts.id, post.id))

    await incrementPostCount(post.userId)
    await maybeReportOverage(post.userId)

    logger.info({ postId: post.id, tweetId: result.tweetId }, 'tweet posted')
  } catch (err) {
    const code = (err as { code?: string }).code

    if (code === 'TOKEN_EXPIRED') {
      try {
        const newAccess = await refreshAndPersist(store.id, store.xRefreshToken)
        const retry = await postTweet(newAccess, textToPost, mediaIds)
        await recordSuccess(post.id, retry.tweetId, tweetUrl(retry.username, retry.tweetId))
        await db
          .update(posts)
          .set({ status: POST_STATUS.POSTED, publishedAt: new Date() })
          .where(eq(posts.id, post.id))
        await incrementPostCount(post.userId)
        await maybeReportOverage(post.userId)
        return
      } catch (refreshErr) {
        logger.error({ err: refreshErr, storeId: store.id }, 'refresh+retry failed')
        await db
          .update(stores)
          .set({ tokenRefreshFailedAt: new Date() })
          .where(eq(stores.id, store.id))
        await enqueueNotify(post.userId, 'x')
        await recordFailure(post.id, 'TOKEN_REFRESH_FAILED', '再認証が必要です')
        await markPostFailed(post.id)
        return
      }
    }

    if (code === 'RATE_LIMITED') {
      // Bubble up so BullMQ retries with backoff
      throw err
    }

    await recordFailure(post.id, 'X_API_ERROR', (err as Error).message ?? 'X API エラー')
    await markPostFailed(post.id)
    throw err
  }
}

async function refreshAndPersist(storeId: string, encryptedRefreshToken: string): Promise<string> {
  const refreshToken = decrypt(encryptedRefreshToken)
  const tokens = await refreshAccessToken(refreshToken)
  const now = new Date()
  await db
    .update(stores)
    .set({
      xAccessToken: encrypt(tokens.access_token),
      xRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : encryptedRefreshToken,
      xTokenExpiresAt: new Date(now.getTime() + tokens.expires_in * 1000),
      tokenRefreshFailedAt: null,
      updatedAt: now,
    })
    .where(eq(stores.id, storeId))
  return tokens.access_token
}

async function recordSuccess(postId: string, tweetId: string, url: string) {
  await db.insert(postResults).values({
    postId,
    platform: 'x',
    status: 'success',
    externalId: tweetId,
    externalUrl: url,
  })
}

async function recordFailure(postId: string, code: string, message: string) {
  await db.insert(postResults).values({
    postId,
    platform: 'x',
    status: 'failed',
    errorCode: code,
    errorMessage: message,
  })
}

async function markPostFailed(postId: string) {
  await db.update(posts).set({ status: POST_STATUS.FAILED }).where(eq(posts.id, postId))
}

async function incrementPostCount(userId: string) {
  const yearMonth = currentYearMonthJST()
  await db
    .insert(usageLogs)
    .values({ userId, yearMonth, postCount: 1 })
    .onConflictDoUpdate({
      target: [usageLogs.userId, usageLogs.yearMonth],
      set: { postCount: sql`${usageLogs.postCount} + 1`, updatedAt: new Date() },
    })
}

/**
 * Report a Stripe Billing Meter usage event when the user has exceeded their
 * plan's monthly cap. Each over-cap post counts as 1 unit at ¥150.
 */
async function maybeReportOverage(userId: string) {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })
  if (!sub || sub.status !== 'active') return

  const yearMonth = currentYearMonthJST()
  const usage = await db.query.usageLogs.findFirst({
    where: and(eq(usageLogs.userId, userId), eq(usageLogs.yearMonth, yearMonth)),
  })
  if (!usage) return

  const cap = PLAN_SPECS[sub.plan as Plan].generateLimit
  if (usage.postCount <= cap) return

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { stripeCustomerId: true },
  })
  if (!user?.stripeCustomerId) return

  try {
    await stripe.billing.meterEvents.create({
      event_name: 'postari_overage',
      payload: {
        stripe_customer_id: user.stripeCustomerId,
        value: '1',
      },
    })
    await db
      .update(usageLogs)
      .set({ overageCount: sql`${usageLogs.overageCount} + 1`, updatedAt: new Date() })
      .where(and(eq(usageLogs.userId, userId), eq(usageLogs.yearMonth, yearMonth)))
  } catch (err) {
    logger.error({ err, userId }, 'failed to report overage to Stripe')
  }
}
