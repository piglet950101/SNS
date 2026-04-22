import { eq } from 'drizzle-orm'
import { stores } from '@postari/db'
import { db } from '../lib/db'
import { decrypt, encrypt } from '../lib/encryption'
import { logger } from '../lib/logger'
import { refreshAccessToken } from '../lib/x'

export interface TokenRefreshJobData {
  storeId: string
}

export async function processTokenRefreshX(
  data: TokenRefreshJobData,
  enqueueNotify: (userId: string, platform: string) => Promise<void>,
): Promise<void> {
  const store = await db.query.stores.findFirst({ where: eq(stores.id, data.storeId) })
  if (!store || !store.xRefreshToken) return

  try {
    const refreshToken = decrypt(store.xRefreshToken)
    const tokens = await refreshAccessToken(refreshToken)
    const now = new Date()
    await db
      .update(stores)
      .set({
        xAccessToken: encrypt(tokens.access_token),
        xRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : store.xRefreshToken,
        xTokenExpiresAt: new Date(now.getTime() + tokens.expires_in * 1000),
        tokenRefreshFailedAt: null,
        updatedAt: now,
      })
      .where(eq(stores.id, store.id))
    logger.info({ storeId: store.id }, 'X token refreshed')
  } catch (err) {
    logger.error({ err, storeId: store.id }, 'X token refresh failed')
    await db
      .update(stores)
      .set({ tokenRefreshFailedAt: new Date(), updatedAt: new Date() })
      .where(eq(stores.id, store.id))
    await enqueueNotify(store.userId, 'x')
    throw err
  }
}
