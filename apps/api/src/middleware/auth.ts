import { verifyToken } from '@clerk/backend'
import type { NextFunction, Request, Response } from 'express'
import { eq } from 'drizzle-orm'
import { users } from '@postari/db'
import { TERMS_VERSION } from '@postari/shared'
import { db } from '../lib/db'
import { clerk } from '../lib/clerk'
import { env } from '../env'
import { unauthorized } from '../lib/errors'
import { logger } from '../lib/logger'

declare module 'express-serve-static-core' {
  interface Request {
    auth?: {
      userId: string // internal users.id (uuid)
      clerkId: string
    }
  }
}

/**
 * Verify Clerk-signed JWT in Authorization: Bearer <token>.
 * On success, attach { userId, clerkId } to req.auth.
 *
 * If the users row doesn't exist yet (Clerk webhook hasn't fired), we fetch
 * the user from Clerk and insert inline — this eliminates the race window
 * between signup completion and the `user.created` webhook landing.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) throw unauthorized()
    const token = header.slice(7)

    const payload = await verifyToken(token, { secretKey: env().CLERK_SECRET_KEY })
    const clerkId = payload.sub
    if (!clerkId) throw unauthorized()

    let existing = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
      columns: { id: true, deletedAt: true },
    })

    if (!existing) {
      // Auto-provision from Clerk (race with webhook).
      try {
        const clerkUser = await clerk.users.getUser(clerkId)
        const email =
          clerkUser.primaryEmailAddress?.emailAddress ??
          clerkUser.emailAddresses[0]?.emailAddress
        if (!email) throw unauthorized('メールアドレスが見つかりません')

        const now = new Date()
        const [row] = await db
          .insert(users)
          .values({
            clerkId,
            email,
            ageVerifiedAt: now,
            antisocialAttestedAt: now,
            termsAcceptedAt: now,
            termsVersion: TERMS_VERSION,
          })
          .onConflictDoUpdate({
            target: users.clerkId,
            set: { updatedAt: now },
          })
          .returning({ id: users.id, deletedAt: users.deletedAt })
        existing = row!
        logger.info({ clerkId, userId: existing.id }, 'auto-provisioned user')
      } catch (err) {
        logger.error({ err, clerkId }, 'auto-provision failed')
        throw unauthorized('アカウント作成に失敗しました。サインアップをやり直してください。')
      }
    }

    if (existing.deletedAt) {
      throw unauthorized('アカウントは削除済みです')
    }

    req.auth = { userId: existing.id, clerkId }
    next()
  } catch (err) {
    next(err)
  }
}
