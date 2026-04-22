import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      'req.headers["stripe-signature"]',
      'req.headers["svix-signature"]',
      '*.access_token',
      '*.refresh_token',
      '*.xAccessToken',
      '*.xRefreshToken',
      '*.googleAccessToken',
      '*.googleRefreshToken',
      '*.igAccessToken',
      '*.wpAppPassword',
      '*.TOKEN_ENCRYPTION_KEY',
      '*.ANTHROPIC_API_KEY',
      '*.STRIPE_SECRET_KEY',
      '*.CLERK_SECRET_KEY',
    ],
    censor: '[REDACTED]',
  },
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } },
})
