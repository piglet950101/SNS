import * as Sentry from '@sentry/node'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import pinoHttp from 'pino-http'
import { env } from './env'
import { logger } from './lib/logger'
import { errorHandler, notFoundHandler } from './middleware/error'
import { healthRouter } from './routes/health'
import { clerkWebhookRouter } from './routes/webhooks/clerk'
import { stripeWebhookRouter } from './routes/webhooks/stripe'
import { xOAuthRouter } from './routes/oauth/x'
import { storesRouter } from './routes/stores'
import { postsRouter } from './routes/posts'
import { tokensRouter } from './routes/tokens'
import { billingRouter } from './routes/billing'
import { accountRouter } from './routes/account'
import { dashboardRouter } from './routes/dashboard'

const e = env()

if (e.SENTRY_DSN_API) {
  Sentry.init({
    dsn: e.SENTRY_DSN_API,
    tracesSampleRate: 0.1,
    environment: e.NODE_ENV,
  })
}

const app = express()

app.set('trust proxy', 1)
app.use(helmet({ contentSecurityPolicy: false }))
app.use(
  cors({
    origin: e.APP_URL,
    credentials: true,
  }),
)
app.use(pinoHttp({ logger }))
app.use(cookieParser())

// -----------------------------------------------------------------------------
// Webhook routes MUST be mounted before express.json(), because they need the
// raw body for signature verification.
// -----------------------------------------------------------------------------
app.use('/api/webhooks/clerk', clerkWebhookRouter)
app.use('/api/webhooks/stripe', stripeWebhookRouter)

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// -----------------------------------------------------------------------------
// Public routes
// -----------------------------------------------------------------------------
app.use('/api/health', healthRouter)

// -----------------------------------------------------------------------------
// Authed routes
// -----------------------------------------------------------------------------
app.use('/api/oauth/x', xOAuthRouter)
app.use('/api/stores', storesRouter)
app.use('/api/posts', postsRouter)
app.use('/api/tokens', tokensRouter)
app.use('/api/billing', billingRouter)
app.use('/api/account', accountRouter)
app.use('/api/dashboard', dashboardRouter)

// -----------------------------------------------------------------------------
// Error + 404
// -----------------------------------------------------------------------------
if (e.SENTRY_DSN_API) {
  Sentry.setupExpressErrorHandler(app)
}
app.use(notFoundHandler)
app.use(errorHandler)

const server = app.listen(e.PORT, () => {
  logger.info({ port: e.PORT, env: e.NODE_ENV }, 'postari-api listening')
})

const shutdown = (signal: string) => () => {
  logger.info({ signal }, 'shutting down')
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGTERM', shutdown('SIGTERM'))
process.on('SIGINT', shutdown('SIGINT'))
