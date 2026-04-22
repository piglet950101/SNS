// -----------------------------------------------------------------------------
// Pricing — locked per 確定仕様書 v2.0 (2026-04-19), §2.
// All values tax-inclusive (税込); Stripe Japan auto-calculates 消費税 via
// tax_behavior: 'inclusive'. Annual discount = monthly × 12 × 0.8 (20% off).
// Source: e:\work\SNS\new\final_spec.pdf §2.1–2.2 + postari_lp.html pricing.
// -----------------------------------------------------------------------------

export const PLANS = {
  STARTER: 'starter',
  STANDARD: 'standard',
  PRO: 'pro',
} as const
export type Plan = (typeof PLANS)[keyof typeof PLANS]

export const BILLING_INTERVALS = {
  MONTH: 'month',
  YEAR: 'year',
} as const
export type BillingInterval = (typeof BILLING_INTERVALS)[keyof typeof BILLING_INTERVALS]

export interface PlanSpec {
  id: Plan
  nameJa: string
  monthlyYen: number
  annualYen: number
  annualEquivMonthlyYen: number
  generateLimit: number
  storeLimit: number
  featuresJa: string[]
}

export const PLAN_SPECS: Record<Plan, PlanSpec> = {
  starter: {
    id: 'starter',
    nameJa: 'スターター',
    monthlyYen: 2_400,
    annualYen: 23_040, // 2400 × 12 × 0.8
    annualEquivMonthlyYen: 1_920,
    generateLimit: 30,
    storeLimit: 1,
    featuresJa: [
      '月30投稿まで',
      '店舗1つ',
      'X 自動投稿',
      'AI投稿文生成（景表法チェック付き）',
      '投稿履歴',
    ],
  },
  standard: {
    id: 'standard',
    nameJa: 'スタンダード',
    monthlyYen: 7_200,
    annualYen: 69_120, // 7200 × 12 × 0.8
    annualEquivMonthlyYen: 5_760,
    generateLimit: 100,
    storeLimit: 3,
    featuresJa: [
      '月100投稿まで',
      '店舗3つまで',
      'X 自動投稿',
      'AI投稿文生成（景表法チェック付き）',
      '投稿履歴・ダッシュボード',
    ],
  },
  pro: {
    id: 'pro',
    nameJa: 'プロ',
    monthlyYen: 18_000,
    annualYen: 172_800, // 18000 × 12 × 0.8
    annualEquivMonthlyYen: 14_400,
    generateLimit: 400,
    storeLimit: 10,
    featuresJa: [
      '月400投稿まで',
      '店舗10店舗まで',
      'X 自動投稿',
      'AI投稿文生成（景表法チェック付き）',
      '投稿履歴・ダッシュボード',
      '超過分は ¥200/投稿（従量課金）',
    ],
  },
}

// ¥200 per excess post over plan cap (v2.0 §2.2).
export const OVERAGE_PER_POST_YEN = 200

// Annual discount percentage — for UI display only.
export const ANNUAL_DISCOUNT_PERCENT = 20

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`
}

export function planByStripePriceId(
  priceId: string,
  priceEnv: {
    STRIPE_PRICE_STARTER_MONTHLY: string
    STRIPE_PRICE_STANDARD_MONTHLY: string
    STRIPE_PRICE_PRO_MONTHLY: string
    STRIPE_PRICE_STARTER_ANNUAL: string
    STRIPE_PRICE_STANDARD_ANNUAL: string
    STRIPE_PRICE_PRO_ANNUAL: string
  },
): { plan: Plan; interval: BillingInterval } | null {
  const map: Record<string, { plan: Plan; interval: BillingInterval }> = {
    [priceEnv.STRIPE_PRICE_STARTER_MONTHLY]: { plan: 'starter', interval: 'month' },
    [priceEnv.STRIPE_PRICE_STANDARD_MONTHLY]: { plan: 'standard', interval: 'month' },
    [priceEnv.STRIPE_PRICE_PRO_MONTHLY]: { plan: 'pro', interval: 'month' },
    [priceEnv.STRIPE_PRICE_STARTER_ANNUAL]: { plan: 'starter', interval: 'year' },
    [priceEnv.STRIPE_PRICE_STANDARD_ANNUAL]: { plan: 'standard', interval: 'year' },
    [priceEnv.STRIPE_PRICE_PRO_ANNUAL]: { plan: 'pro', interval: 'year' },
  }
  return map[priceId] ?? null
}
