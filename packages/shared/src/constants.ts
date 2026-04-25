// -----------------------------------------------------------------------------
// Application-wide constants
// -----------------------------------------------------------------------------

export const APP_NAME = 'Postari'
export const APP_NAME_JA = 'ポスタリ'
export const COMPANY_NAME = '株式会社アテナ'
export const REPRESENTATIVE = '山本 和隆'
export const BUSINESS_EMAIL = 'info@athena.asia'
export const SUPPORT_EMAIL = 'support@postari.jp'

// Terms version — stamped into users.termsVersion on signup acceptance.
export const TERMS_VERSION = '2026-04-19'

// Free trial: 3 generations lifetime (not monthly). The guide defines it as
// "3 free generations" — we gate on the lifetime total, not per-month.
export const TRIAL_GENERATION_LIMIT = 3

// Preview screen platforms: which ones are blurred for trial users.
export const TRIAL_BLURRED_PLATFORMS = ['google_business', 'instagram', 'wordpress'] as const

// Image upload limits
export const MAX_IMAGES_PER_POST = 4
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB
export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const

// X constraints
export const X_TWEET_MAX_LENGTH = 140
export const X_MAX_MEDIA_PER_TWEET = 4

// Token lifecycle
export const TOKEN_EXPIRY_WARNING_DAYS = 3
export const TOKEN_REFRESH_THRESHOLD_DAYS = 7

// Data retention
export const SOFT_DELETE_RETENTION_DAYS = 90
export const ACCESS_LOG_RETENTION_MONTHS = 6

// Rate limits (per user / min)
export const RATE_LIMIT_GENERATE_PER_USER_PER_MIN = 5
export const RATE_LIMIT_OAUTH_PER_IP_PER_MIN = 10

// BullMQ queue names (MUST match across api + worker).
// Note: BullMQ 5.13+ disallows ':' in queue names — use '-' instead.
export const QUEUES = {
  POST_X: 'post-x',
  TOKEN_REFRESH_X: 'token-refresh-x',
  NOTIFY_TOKEN_EXPIRED: 'notify-token-expired',
  CLEANUP_RETENTION: 'cleanup-retention',
} as const
export type QueueName = (typeof QUEUES)[keyof typeof QUEUES]

// Platform identifiers
export const PLATFORMS = {
  X: 'x',
  GOOGLE: 'google_business',
  WORDPRESS: 'wordpress',
  INSTAGRAM: 'instagram',
} as const
export type Platform = (typeof PLATFORMS)[keyof typeof PLATFORMS]

// Post status state machine
export const POST_STATUS = {
  DRAFT: 'draft',
  GENERATING: 'generating',
  PREVIEW: 'preview',
  POSTING: 'posting',
  POSTED: 'posted',
  FAILED: 'failed',
} as const
export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS]

// Business types
export const BUSINESS_TYPES = {
  MAID_CAFE: 'maid_cafe',
  CONCEPT_CAFE: 'concept_cafe',
  RESTAURANT: 'restaurant',
  BAR: 'bar',
  OTHER: 'other',
} as const
export type BusinessType = (typeof BUSINESS_TYPES)[keyof typeof BUSINESS_TYPES]

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  maid_cafe: 'メイドカフェ',
  concept_cafe: 'コンセプトカフェ',
  restaurant: '飲食店',
  bar: 'バー',
  other: 'その他',
}
