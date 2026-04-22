import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  APP_URL: z.string().url(),
  API_URL: z.string().url().optional(),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),

  // Cloudflare R2 — env var names chosen by client (株式会社アテナ).
  // See DEPLOYMENT_PLAN.md §2 for values to set in Render.
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string().min(1),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1).default('postari-images'),
  R2_PUBLIC_URL: z.string().url(),
  R2_ENDPOINT: z.string().url().optional(),

  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-5'),

  X_OAUTH_CLIENT_ID: z.string().min(1),
  X_OAUTH_CLIENT_SECRET: z.string().min(1),
  X_OAUTH_CALLBACK_URL: z.string().url(),

  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRICE_STARTER_MONTHLY: z.string().min(1),
  STRIPE_PRICE_STANDARD_MONTHLY: z.string().min(1),
  STRIPE_PRICE_PRO_MONTHLY: z.string().min(1),
  STRIPE_PRICE_STARTER_ANNUAL: z.string().min(1),
  STRIPE_PRICE_STANDARD_ANNUAL: z.string().min(1),
  STRIPE_PRICE_PRO_ANNUAL: z.string().min(1),
  STRIPE_PRICE_OVERAGE: z.string().min(1),

  TOKEN_ENCRYPTION_KEY: z.string().min(32, 'TOKEN_ENCRYPTION_KEY must be base64-encoded 32 bytes'),

  SENTRY_DSN_API: z.string().url().optional().or(z.literal('')),
  SUPPORT_EMAIL: z.string().email().default('support@postari.jp'),
  FROM_EMAIL: z.string().email().default('noreply@postari.jp'),
  SLACK_WEBHOOK_URL: z.string().url().optional().or(z.literal('')),
})

export type Env = z.infer<typeof envSchema>

let _env: Env | undefined
export function env(): Env {
  if (_env) return _env
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('❌ Invalid environment:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment — aborting')
  }
  _env = parsed.data
  return _env
}
