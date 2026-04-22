import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { subscriptions, users } from '@postari/db'
import { schemas, type Plan } from '@postari/shared'
import { db } from '../lib/db'
import { requireAuth } from '../middleware/auth'
import { stripe } from '../lib/stripe'
import { env } from '../env'
import { clerk } from '../lib/clerk'
import { badRequest, notFound } from '../lib/errors'

export const billingRouter = Router()

billingRouter.use(requireAuth)

function priceIdFor(plan: Plan, interval: 'month' | 'year'): string {
  const e = env()
  if (plan === 'starter') return interval === 'month' ? e.STRIPE_PRICE_STARTER_MONTHLY : e.STRIPE_PRICE_STARTER_ANNUAL
  if (plan === 'standard') return interval === 'month' ? e.STRIPE_PRICE_STANDARD_MONTHLY : e.STRIPE_PRICE_STANDARD_ANNUAL
  return interval === 'month' ? e.STRIPE_PRICE_PRO_MONTHLY : e.STRIPE_PRICE_PRO_ANNUAL
}

billingRouter.post('/checkout', async (req, res, next) => {
  try {
    const input = schemas.checkoutSchema.parse(req.body)
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.auth!.userId),
    })
    if (!user) throw notFound()

    // Ensure Stripe Customer
    let customerId = user.stripeCustomerId
    if (!customerId) {
      // Try to enrich name from Clerk
      const clerkUser = await clerk.users.getUser(req.auth!.clerkId).catch(() => null)
      const name = clerkUser ? `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() : undefined
      const customer = await stripe.customers.create({
        email: user.email,
        name: name || undefined,
        metadata: { postari_user_id: user.id, clerk_id: user.clerkId },
      })
      customerId = customer.id
      await db
        .update(users)
        .set({ stripeCustomerId: customerId, updatedAt: new Date() })
        .where(eq(users.id, user.id))
    }

    const priceId = priceIdFor(input.plan, input.interval)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [
        { price: priceId, quantity: 1 },
        // Metered overage item — billed via usage records on each post.
        { price: env().STRIPE_PRICE_OVERAGE },
      ],
      subscription_data: {
        metadata: { postari_user_id: user.id, plan: input.plan, interval: input.interval },
        // Annual plans: disable proration on subsequent mid-cycle swaps to avoid surprise charges.
        proration_behavior: input.interval === 'year' ? 'none' : 'create_prorations',
      },
      success_url: `${env().APP_URL}/post?billing=success`,
      cancel_url: `${env().APP_URL}/billing/setup?canceled=true`,
      automatic_tax: { enabled: true },
      allow_promotion_codes: true,
    })

    if (!session.url) throw new Error('Stripe returned no checkout URL')
    res.json({ url: session.url })
  } catch (err) {
    next(err)
  }
})

billingRouter.post('/portal', async (req, res, next) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.auth!.userId),
      columns: { stripeCustomerId: true },
    })
    if (!user?.stripeCustomerId) throw badRequest('まだ決済情報が登録されていません')

    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${env().APP_URL}/dashboard`,
    })
    res.json({ url: portal.url })
  } catch (err) {
    next(err)
  }
})

billingRouter.get('/subscription', async (req, res, next) => {
  try {
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, req.auth!.userId),
    })
    res.json({ subscription: sub ?? null })
  } catch (err) {
    next(err)
  }
})

billingRouter.get('/invoice/:id', async (req, res, next) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.auth!.userId),
      columns: { stripeCustomerId: true },
    })
    if (!user?.stripeCustomerId) throw notFound()
    const inv = await stripe.invoices.retrieve(req.params.id!)
    if (inv.customer !== user.stripeCustomerId) throw notFound()
    if (!inv.hosted_invoice_url) throw notFound('invoice URL unavailable')
    res.redirect(302, inv.hosted_invoice_url)
  } catch (err) {
    next(err)
  }
})
