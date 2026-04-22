import { Router, raw } from 'express'
import { and, eq } from 'drizzle-orm'
import type Stripe from 'stripe'
import { subscriptions, users } from '@postari/db'
import { planByStripePriceId, type BillingInterval, type Plan } from '@postari/shared'
import { db } from '../../lib/db'
import { stripe } from '../../lib/stripe'
import { env } from '../../env'
import { logger } from '../../lib/logger'

export const stripeWebhookRouter = Router()

stripeWebhookRouter.post('/', raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const sig = req.header('stripe-signature')
    if (!sig) {
      return res
        .status(400)
        .json({ error: { code: 'BAD_WEBHOOK', message: 'missing stripe-signature' } })
    }
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, env().STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      logger.warn({ err }, 'Stripe webhook signature verification failed')
      return res.status(400).json({ error: { code: 'BAD_SIGNATURE', message: 'invalid' } })
    }

    logger.info({ type: event.type, id: event.id }, 'stripe event received')

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await upsertSubscription(event.data.object as Stripe.Subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await db
          .update(subscriptions)
          .set({
            status: 'canceled',
            cancelAtPeriodEnd: false,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, sub.id))
        break
      }
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice
        logger.info({ invoiceId: inv.id, status: inv.status }, 'invoice event')
        // Counter resets happen implicitly: usage_logs is keyed by yearMonth, so
        // the new month starts fresh. Nothing to update here directly.
        break
      }
      default:
        logger.debug({ type: event.type }, 'unhandled stripe event')
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    next(err)
  }
})

async function upsertSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const u = await db.query.users.findFirst({
    where: eq(users.stripeCustomerId, customerId),
    columns: { id: true },
  })
  if (!u) {
    logger.warn({ customerId, subId: sub.id }, 'stripe sub for unknown customer — skipping')
    return
  }

  const item = sub.items.data[0]
  if (!item) return

  const priceId = item.price.id
  const match = planByStripePriceId(priceId, {
    STRIPE_PRICE_STARTER_MONTHLY: env().STRIPE_PRICE_STARTER_MONTHLY,
    STRIPE_PRICE_STANDARD_MONTHLY: env().STRIPE_PRICE_STANDARD_MONTHLY,
    STRIPE_PRICE_PRO_MONTHLY: env().STRIPE_PRICE_PRO_MONTHLY,
    STRIPE_PRICE_STARTER_ANNUAL: env().STRIPE_PRICE_STARTER_ANNUAL,
    STRIPE_PRICE_STANDARD_ANNUAL: env().STRIPE_PRICE_STANDARD_ANNUAL,
    STRIPE_PRICE_PRO_ANNUAL: env().STRIPE_PRICE_PRO_ANNUAL,
  })
  if (!match) {
    logger.warn({ priceId, subId: sub.id }, 'subscription price not mapped to a plan')
    return
  }

  const now = new Date()
  await db
    .insert(subscriptions)
    .values({
      userId: u.id,
      stripeSubscriptionId: sub.id,
      plan: match.plan as Plan,
      billingInterval: match.interval as BillingInterval,
      status: mapStripeStatus(sub.status),
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeSubscriptionId: sub.id,
        plan: match.plan as Plan,
        billingInterval: match.interval as BillingInterval,
        status: mapStripeStatus(sub.status),
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        updatedAt: now,
      },
    })
}

function mapStripeStatus(s: Stripe.Subscription.Status): 'active' | 'past_due' | 'canceled' | 'incomplete' {
  switch (s) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
    case 'unpaid':
      return 'past_due'
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled'
    default:
      return 'incomplete'
  }
}
