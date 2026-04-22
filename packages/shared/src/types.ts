import type { BusinessType, Platform, PostStatus } from './constants'
import type { BillingInterval, Plan } from './pricing'

// -----------------------------------------------------------------------------
// DTOs shared between api and web
// -----------------------------------------------------------------------------

export interface StoreDTO {
  id: string
  name: string
  businessType: BusinessType
  area: string
  xConnected: boolean
  xUsername: string | null
  xTokenExpiresAt: string | null
}

export interface PostDTO {
  id: string
  storeId: string
  status: PostStatus
  isTrial: boolean
  imageUrls: string[]
  hint: string | null
  generatedForX: string | null
  editedForX: string | null
  generatedForGoogle: string | null
  generatedForInstagram: string | null
  generatedForWp: { title: string; body: string } | null
  results: PostResultDTO[]
  createdAt: string
  publishedAt: string | null
}

export interface PostResultDTO {
  id: string
  platform: Platform
  status: 'success' | 'failed' | 'skipped'
  externalId: string | null
  externalUrl: string | null
  errorCode: string | null
  errorMessage: string | null
  attemptedAt: string
}

export interface SubscriptionDTO {
  plan: Plan
  billingInterval: BillingInterval
  status: 'active' | 'past_due' | 'canceled' | 'incomplete'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

export interface TrialStatusDTO {
  isTrial: boolean
  remaining: number
  limit: number
  exhausted: boolean
}

export interface TokenStatusDTO {
  x: {
    connected: boolean
    expiresAt: string | null
    expiresInDays: number | null
    needsRefresh: boolean
  }
}

export interface DashboardDTO {
  plan: Plan | 'trial'
  subscription: SubscriptionDTO | null
  trial: TrialStatusDTO
  usage: {
    yearMonth: string
    postCount: number
    generateCount: number
    overageCount: number
    limit: number
  }
  tokenWarning: {
    platform: Platform
    daysUntilExpiry: number
  } | null
  recentPosts: PostDTO[]
}

// Unified API error envelope
export interface ApiError {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export const ERROR_CODES = {
  VALIDATION: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  TRIAL_EXHAUSTED: 'TRIAL_EXHAUSTED',
  PLAN_LIMIT_EXCEEDED: 'PLAN_LIMIT_EXCEEDED',
  RATE_LIMITED: 'RATE_LIMITED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
  X_API_ERROR: 'X_API_ERROR',
  CLAUDE_ERROR: 'CLAUDE_ERROR',
  STRIPE_ERROR: 'STRIPE_ERROR',
  INTERNAL: 'INTERNAL_ERROR',
  INVALID_POST_STATUS: 'INVALID_POST_STATUS',
  GUARDRAIL_VIOLATION: 'GUARDRAIL_VIOLATION',
} as const
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
