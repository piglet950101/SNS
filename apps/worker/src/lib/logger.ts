import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    paths: [
      '*.access_token',
      '*.refresh_token',
      '*.xAccessToken',
      '*.xRefreshToken',
      '*.TOKEN_ENCRYPTION_KEY',
    ],
    censor: '[REDACTED]',
  },
})
