import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import { stores } from '@postari/db'
import { QUEUES, TOKEN_EXPIRY_WARNING_DAYS, type TokenStatusDTO } from '@postari/shared'
import { db } from '../lib/db'
import { requireAuth } from '../middleware/auth'
import { badRequest, notFound } from '../lib/errors'
import { queues } from '../lib/queue'

export const tokensRouter = Router()

tokensRouter.use(requireAuth)

tokensRouter.get('/status', async (req, res, next) => {
  try {
    const row = await db.query.stores.findFirst({
      where: eq(stores.userId, req.auth!.userId),
      columns: {
        xUsername: true,
        xTokenExpiresAt: true,
      },
    })

    const x: TokenStatusDTO['x'] = row?.xUsername
      ? {
          connected: true,
          expiresAt: row.xTokenExpiresAt?.toISOString() ?? null,
          expiresInDays: row.xTokenExpiresAt
            ? Math.floor((row.xTokenExpiresAt.getTime() - Date.now()) / 86_400_000)
            : null,
          needsRefresh:
            !!row.xTokenExpiresAt &&
            row.xTokenExpiresAt.getTime() - Date.now() <
              TOKEN_EXPIRY_WARNING_DAYS * 86_400_000,
        }
      : { connected: false, expiresAt: null, expiresInDays: null, needsRefresh: false }

    res.json({ x } satisfies TokenStatusDTO)
  } catch (err) {
    next(err)
  }
})

tokensRouter.post('/refresh/:platform', async (req, res, next) => {
  try {
    if (req.params.platform !== 'x') throw badRequest('Phase 1 は X のみ対応です')

    const store = await db.query.stores.findFirst({
      where: and(eq(stores.userId, req.auth!.userId)),
      columns: { id: true, xRefreshToken: true },
    })
    if (!store?.xRefreshToken) throw notFound('X 連携が見つかりません')

    await queues.tokenRefreshX.add(
      QUEUES.TOKEN_REFRESH_X,
      { storeId: store.id },
      { jobId: `token-refresh-x-${store.id}-${Date.now()}` },
    )
    res.json({ ok: true, queued: true })
  } catch (err) {
    next(err)
  }
})
