import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),

  X_OAUTH_CLIENT_ID: z.string().min(1),
  X_OAUTH_CLIENT_SECRET: z.string().min(1),
  X_OAUTH_CALLBACK_URL: z.string().url(),

  TOKEN_ENCRYPTION_KEY: z.string().min(32),

  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_PRICE_OVERAGE: z.string().min(1),

  SENTRY_DSN_WORKER: z.string().url().optional().or(z.literal('')),

  SUPPORT_EMAIL: z.string().email().default('support@postari.jp'),
  FROM_EMAIL: z.string().email().default('noreply@postari.jp'),
  APP_URL: z.string().url(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  SLACK_WEBHOOK_URL: z.string().url().optional().or(z.literal('')),
})

export type WorkerEnv = z.infer<typeof envSchema>

let _env: WorkerEnv | undefined
export function env(): WorkerEnv {
  if (_env) return _env
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('❌ Invalid worker environment:', parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment — aborting')
  }
  _env = parsed.data
  return _env
}
