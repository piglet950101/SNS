import { Router, raw } from 'express'
import { Webhook } from 'svix'
import { eq } from 'drizzle-orm'
import { users } from '@postari/db'
import { TERMS_VERSION } from '@postari/shared'
import { env } from '../../env'
import { db } from '../../lib/db'
import { logger } from '../../lib/logger'

export const clerkWebhookRouter = Router()

interface ClerkEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted' | string
  data: {
    id: string
    email_addresses?: { email_address: string; id: string }[]
    primary_email_address_id?: string
    deleted?: boolean
  }
}

/**
 * Clerk posts events here. We verify signature with svix, then:
 *   - user.created: insert users row with consent timestamps = now().
 *   - user.deleted: soft-delete (real purge via retention cron after 90 days).
 *
 * NOTE: this route is mounted BEFORE express.json() in server.ts so the raw
 * body is available for signature verification.
 */
clerkWebhookRouter.post('/', raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const svix_id = req.header('svix-id')
    const svix_ts = req.header('svix-timestamp')
    const svix_sig = req.header('svix-signature')
    if (!svix_id || !svix_ts || !svix_sig) {
      return res.status(400).json({ error: { code: 'BAD_WEBHOOK', message: 'missing svix headers' } })
    }

    const payload = req.body as Buffer
    const wh = new Webhook(env().CLERK_WEBHOOK_SECRET)
    let event: ClerkEvent
    try {
      event = wh.verify(payload.toString('utf8'), {
        'svix-id': svix_id,
        'svix-timestamp': svix_ts,
        'svix-signature': svix_sig,
      }) as ClerkEvent
    } catch (err) {
      logger.warn({ err }, 'Clerk webhook signature verification failed')
      return res.status(400).json({ error: { code: 'BAD_SIGNATURE', message: 'invalid signature' } })
    }

    switch (event.type) {
      case 'user.created': {
        const email =
          event.data.email_addresses?.find((e) => e.id === event.data.primary_email_address_id)
            ?.email_address ?? event.data.email_addresses?.[0]?.email_address
        if (!email) {
          logger.warn({ clerkId: event.data.id }, 'user.created without email — skipping')
          break
        }
        const now = new Date()
        await db
          .insert(users)
          .values({
            clerkId: event.data.id,
            email,
            // Consent is captured on our own signup screen; Clerk webhook arrives
            // after that screen's onSubmit so we stamp "now" defensively. The
            // authoritative capture happens via the separate consent API if we
            // add one; Phase 1 relies on the signup screen blocking submit
            // until all 3 checkboxes are ticked.
            ageVerifiedAt: now,
            antisocialAttestedAt: now,
            termsAcceptedAt: now,
            termsVersion: TERMS_VERSION,
          })
          .onConflictDoNothing({ target: users.clerkId })
        break
      }
      case 'user.deleted': {
        await db
          .update(users)
          .set({ deletedAt: new Date() })
          .where(eq(users.clerkId, event.data.id))
        break
      }
      case 'user.updated': {
        const email =
          event.data.email_addresses?.find((e) => e.id === event.data.primary_email_address_id)
            ?.email_address
        if (email) {
          await db.update(users).set({ email, updatedAt: new Date() }).where(eq(users.clerkId, event.data.id))
        }
        break
      }
      default:
        logger.debug({ type: event.type }, 'unhandled clerk event')
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    next(err)
  }
})
