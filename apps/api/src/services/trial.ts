import { eq } from 'drizzle-orm'
import { subscriptions } from '@postari/db'
import { PLAN_SPECS, TRIAL_GENERATION_LIMIT, type Plan } from '@postari/shared'
import { db } from '../lib/db'
import { getLifetimeGenerationCount, getUsageForMonth } from './usage'

export interface GateResult {
  allowed: boolean
  isTrial: boolean
  reason?: 'TRIAL_EXHAUSTED'
  remaining?: number
  limit?: number
  plan?: Plan
  /**
   * True if the current month's post count is already at/over the plan cap.
   * The gate still returns allowed: true — per v2.0 §2.2 the system accepts
   * over-cap posts and bills ¥200/post as overage. This flag lets callers
   * surface a warning to the user so there's no surprise charge.
   */
  isOverage?: boolean
}

/**
 * Gate the "generate" action per v2.0 spec:
 *   - Unsubscribed users: allowed while lifetime generations < 3 (v2.0 §2.3).
 *   - Subscribed users: ALWAYS allowed. Post caps are enforced at post time
 *     via overage billing, not at generation time (v2.0 §2.1–2.2). The 30/
 *     100/400 numbers in the plan table are POST caps, not generation caps.
 *     Overage billing: ¥200 per post over cap (Stripe meter, handled by worker).
 */
export async function gateGenerate(userId: string): Promise<GateResult> {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })

  // Trial path: lifetime 3-generation cap.
  if (!sub || sub.status !== 'active') {
    const used = await getLifetimeGenerationCount(userId)
    const remaining = Math.max(0, TRIAL_GENERATION_LIMIT - used)
    if (remaining <= 0) {
      return {
        allowed: false,
        isTrial: true,
        reason: 'TRIAL_EXHAUSTED',
        remaining: 0,
        limit: TRIAL_GENERATION_LIMIT,
      }
    }
    return { allowed: true, isTrial: true, remaining, limit: TRIAL_GENERATION_LIMIT }
  }

  // Paid path: always allow. Flag overage so frontend can warn.
  const plan = sub.plan as Plan
  const usage = await getUsageForMonth(userId)
  const limit = PLAN_SPECS[plan].generateLimit // post cap, not generation cap
  const isOverage = usage.postCount >= limit

  return {
    allowed: true,
    isTrial: false,
    remaining: Math.max(0, limit - usage.postCount),
    limit,
    plan,
    isOverage,
  }
}

export async function trialStatus(userId: string) {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })
  const isTrial = !sub || sub.status !== 'active'
  if (!isTrial) {
    return { isTrial: false, remaining: 0, limit: 0, exhausted: false }
  }
  const used = await getLifetimeGenerationCount(userId)
  const remaining = Math.max(0, TRIAL_GENERATION_LIMIT - used)
  return {
    isTrial: true,
    remaining,
    limit: TRIAL_GENERATION_LIMIT,
    exhausted: remaining <= 0,
  }
}
