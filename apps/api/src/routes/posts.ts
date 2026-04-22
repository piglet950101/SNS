import { Router } from 'express'
import { and, desc, eq, inArray, lt } from 'drizzle-orm'
import { postResults, posts, subscriptions } from '@postari/db'
import {
  POST_STATUS,
  QUEUES,
  schemas,
  TRIAL_GENERATION_LIMIT,
  type PostDTO,
  type PostResultDTO,
  type Platform,
} from '@postari/shared'
import { db } from '../lib/db'
import { requireAuth } from '../middleware/auth'
import { generateRateLimit } from '../middleware/rate-limit'
import {
  badRequest,
  forbidden,
  HttpError,
  notFound,
  trialExhausted,
} from '../lib/errors'
import { ERROR_CODES } from '@postari/shared'
import { runGeneration } from '../services/generation'
import { gateGenerate } from '../services/trial'
import { getLifetimeGenerationCount, incrementCounter } from '../services/usage'
import { createSignedUploadUrl } from '../lib/r2'
import { queues } from '../lib/queue'
import { logger } from '../lib/logger'

export const postsRouter = Router()

postsRouter.use(requireAuth)

// ---- POST /upload-url ------------------------------------------------------
postsRouter.post('/upload-url', async (req, res, next) => {
  try {
    const input = schemas.uploadUrlSchema.parse(req.body)
    const out = await createSignedUploadUrl(req.auth!.userId, input.filename, input.contentType)
    res.json(out)
  } catch (err) {
    next(err)
  }
})

// ---- GET /generate/count ---------------------------------------------------
postsRouter.get('/generate/count', async (req, res, next) => {
  try {
    const used = await getLifetimeGenerationCount(req.auth!.userId)
    const remaining = Math.max(0, TRIAL_GENERATION_LIMIT - used)
    res.json({ remaining, total: TRIAL_GENERATION_LIMIT })
  } catch (err) {
    next(err)
  }
})

// ---- POST /generate --------------------------------------------------------
postsRouter.post('/generate', generateRateLimit, async (req, res, next) => {
  try {
    const input = schemas.generatePostSchema.parse(req.body)

    const gate = await gateGenerate(req.auth!.userId)
    if (!gate.allowed) {
      if (gate.reason === 'TRIAL_EXHAUSTED') throw trialExhausted()
      throw new Error('unexpected gate result')
    }

    // Increment BEFORE generation so a Claude failure still counts toward the
    // trial limit — prevents abuse via infinite-retry.
    await incrementCounter(req.auth!.userId, 'generateCount')

    const postId = await runGeneration({
      userId: req.auth!.userId,
      storeId: input.storeId,
      imageUrls: input.imageUrls,
      hint: input.hint,
      isTrial: gate.isTrial,
    })

    res.json({
      postId,
      isTrial: gate.isTrial,
      isOverage: gate.isOverage ?? false,
    })
  } catch (err) {
    next(err)
  }
})

// ---- GET /history?cursor=&limit= -------------------------------------------
// Must be defined BEFORE /:id so "/history" doesn't match the :id param.
postsRouter.get('/history', async (req, res, next) => {
  try {
    const { cursor, limit } = schemas.historyQuerySchema.parse(req.query)

    const where = cursor
      ? and(eq(posts.userId, req.auth!.userId), lt(posts.createdAt, new Date(cursor)))
      : eq(posts.userId, req.auth!.userId)

    const rows = await db
      .select()
      .from(posts)
      .where(where)
      .orderBy(desc(posts.createdAt))
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? page[page.length - 1]!.createdAt.toISOString() : null

    const ids = page.map((r) => r.id)
    const results = ids.length
      ? await db.select().from(postResults).where(inArray(postResults.postId, ids))
      : []
    const byPost = new Map<string, PostResultDTO[]>()
    for (const r of results) {
      const list = byPost.get(r.postId) ?? []
      list.push(resultDTO(r))
      byPost.set(r.postId, list)
    }

    const dtos: PostDTO[] = page.map((p) => postDTO(p, byPost.get(p.id) ?? []))
    res.json({ posts: dtos, nextCursor })
  } catch (err) {
    next(err)
  }
})

// ---- GET /:id --------------------------------------------------------------
postsRouter.get('/:id', async (req, res, next) => {
  try {
    const [post, sub] = await Promise.all([
      fetchPostWithResults(req.params.id!, req.auth!.userId),
      db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, req.auth!.userId),
      }),
    ])
    const currentlyOnTrial = !sub || sub.status !== 'active'
    res.json({ post, currentlyOnTrial })
  } catch (err) {
    next(err)
  }
})

// ---- GET /:id/status -------------------------------------------------------
postsRouter.get('/:id/status', async (req, res, next) => {
  try {
    const row = await db.query.posts.findFirst({
      where: eq(posts.id, req.params.id!),
      columns: { id: true, userId: true, status: true },
    })
    if (!row) throw notFound()
    if (row.userId !== req.auth!.userId) throw forbidden()
    res.json({ status: row.status })
  } catch (err) {
    next(err)
  }
})

// ---- PATCH /:id ------------------------------------------------------------
postsRouter.patch('/:id', async (req, res, next) => {
  try {
    const input = schemas.updatePostSchema.parse(req.body)
    const row = await db.query.posts.findFirst({
      where: eq(posts.id, req.params.id!),
      columns: { id: true, userId: true, status: true },
    })
    if (!row) throw notFound()
    if (row.userId !== req.auth!.userId) throw forbidden()
    if (row.status !== POST_STATUS.PREVIEW) {
      throw badRequest('プレビュー状態の投稿のみ編集できます')
    }
    await db
      .update(posts)
      .set({ editedForX: input.editedForX ?? null })
      .where(eq(posts.id, row.id))
    const post = await fetchPostWithResults(row.id, req.auth!.userId)
    res.json({ post })
  } catch (err) {
    next(err)
  }
})

// ---- POST /:id/publish -----------------------------------------------------
postsRouter.post('/:id/publish', async (req, res, next) => {
  try {
    const row = await db.query.posts.findFirst({
      where: eq(posts.id, req.params.id!),
      columns: { id: true, userId: true, status: true, isTrial: true },
    })
    if (!row) throw notFound()
    if (row.userId !== req.auth!.userId) throw forbidden()
    if (row.status !== POST_STATUS.PREVIEW) {
      throw badRequest('プレビュー状態の投稿のみ公開できます')
    }

    // Gate on CURRENT subscription, not the post's isTrial flag: a user who
    // generated a post during trial can still publish it after subscribing.
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, req.auth!.userId),
    })
    if (!sub || sub.status !== 'active') {
      throw new HttpError(
        402,
        ERROR_CODES.TRIAL_EXHAUSTED,
        '投稿するにはプランに加入してください。',
      )
    }

    await db.update(posts).set({ status: POST_STATUS.POSTING }).where(eq(posts.id, row.id))

    await queues.postX.add(
      QUEUES.POST_X,
      { postId: row.id },
      {
        jobId: `post-x-${row.id}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 10_000 },
      },
    )

    logger.info({ postId: row.id }, 'post:x job enqueued')
    res.json({ ok: true, status: POST_STATUS.POSTING })
  } catch (err) {
    next(err)
  }
})

// ---- helpers ---------------------------------------------------------------
async function fetchPostWithResults(postId: string, userId: string): Promise<PostDTO> {
  const p = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
  })
  if (!p) throw notFound()
  if (p.userId !== userId) throw forbidden()
  const results = await db.query.postResults.findMany({
    where: eq(postResults.postId, p.id),
  })
  return postDTO(p, results.map(resultDTO))
}

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
