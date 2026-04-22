import { eq } from 'drizzle-orm'
import { posts, stores } from '@postari/db'
import { BUSINESS_TYPE_LABELS, POST_STATUS, type BusinessType } from '@postari/shared'
import { db } from '../lib/db'
import { generateXPost } from '../lib/claude'
import { forbidden, notFound } from '../lib/errors'
import { logger } from '../lib/logger'

export interface RunGenerationInput {
  userId: string
  storeId: string
  imageUrls: string[]
  hint?: string
  isTrial: boolean
}

/**
 * Run a synchronous Claude generation for X and persist results on the post.
 * Target latency: < 15 seconds. If we exceed 30s we should flip to async
 * (enqueue a job + poll) but that's out of scope for Phase 1.
 */
export async function runGeneration(input: RunGenerationInput): Promise<string> {
  const store = await db.query.stores.findFirst({
    where: eq(stores.id, input.storeId),
    columns: { id: true, userId: true, name: true, businessType: true, area: true },
  })
  if (!store) throw notFound('店舗が見つかりません')
  if (store.userId !== input.userId) throw forbidden()

  const [row] = await db
    .insert(posts)
    .values({
      userId: input.userId,
      storeId: input.storeId,
      imageUrls: input.imageUrls,
      hint: input.hint ?? null,
      status: POST_STATUS.GENERATING,
      isTrial: input.isTrial,
    })
    .returning({ id: posts.id })

  const postId = row!.id

  try {
    const result = await generateXPost({
      store: {
        name: store.name,
        businessType:
          BUSINESS_TYPE_LABELS[store.businessType as BusinessType] ?? store.businessType,
        area: store.area,
      },
      hint: input.hint,
      imageUrls: input.imageUrls,
    })

    if (result.violations.length > 0) {
      logger.warn(
        { postId, violations: result.violations },
        'Claude output still violates 景表法 after retry — saving anyway; user can edit',
      )
    }

    await db
      .update(posts)
      .set({
        generatedForX: result.text,
        status: POST_STATUS.PREVIEW,
      })
      .where(eq(posts.id, postId))

    return postId
  } catch (err) {
    logger.error({ err, postId }, 'generation failed')
    await db
      .update(posts)
      .set({ status: POST_STATUS.FAILED })
      .where(eq(posts.id, postId))
    throw err
  }
}
