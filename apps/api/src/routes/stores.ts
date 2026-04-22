import { Router } from 'express'
import { count, desc, eq } from 'drizzle-orm'
import { stores, subscriptions } from '@postari/db'
import {
  ERROR_CODES,
  PLAN_SPECS,
  schemas,
  type BusinessType,
  type Plan,
  type StoreDTO,
} from '@postari/shared'
import { db } from '../lib/db'
import { requireAuth } from '../middleware/auth'
import { HttpError, forbidden, notFound } from '../lib/errors'

export const storesRouter = Router()

storesRouter.use(requireAuth)

storesRouter.get('/', async (req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(stores)
      .where(eq(stores.userId, req.auth!.userId))
      .orderBy(desc(stores.createdAt))
    res.json({ stores: rows.map(toDTO) })
  } catch (err) {
    next(err)
  }
})

storesRouter.post('/', async (req, res, next) => {
  try {
    const input = schemas.createStoreSchema.parse(req.body)

    // Enforce store-count cap per v2.0 §2.1.
    // Trial users: 1 store. Paid users: plan.storeLimit (1/3/10).
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, req.auth!.userId),
    })
    const planStoreLimit =
      sub && sub.status === 'active' ? PLAN_SPECS[sub.plan as Plan].storeLimit : 1

    const [{ n }] = await db
      .select({ n: count() })
      .from(stores)
      .where(eq(stores.userId, req.auth!.userId))

    if (n >= planStoreLimit) {
      throw new HttpError(
        409,
        ERROR_CODES.PLAN_LIMIT_EXCEEDED,
        `現在のプランでは店舗${planStoreLimit}件までです。プランをアップグレードしてください。`,
      )
    }

    const [row] = await db
      .insert(stores)
      .values({
        userId: req.auth!.userId,
        name: input.name,
        businessType: input.businessType,
        area: input.area,
      })
      .returning()
    res.status(201).json({ store: toDTO(row!) })
  } catch (err) {
    next(err)
  }
})

storesRouter.patch('/:id', async (req, res, next) => {
  try {
    const input = schemas.updateStoreSchema.parse(req.body)
    const row = await db.query.stores.findFirst({ where: eq(stores.id, req.params.id!) })
    if (!row) throw notFound()
    if (row.userId !== req.auth!.userId) throw forbidden()
    const [updated] = await db
      .update(stores)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(stores.id, row.id))
      .returning()
    res.json({ store: toDTO(updated!) })
  } catch (err) {
    next(err)
  }
})

function toDTO(s: typeof stores.$inferSelect): StoreDTO {
  return {
    id: s.id,
    name: s.name,
    businessType: s.businessType as BusinessType,
    area: s.area,
    xConnected: !!s.xUsername,
    xUsername: s.xUsername,
    xTokenExpiresAt: s.xTokenExpiresAt?.toISOString() ?? null,
  }
}
