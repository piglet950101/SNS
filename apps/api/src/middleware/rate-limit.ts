import rateLimit from 'express-rate-limit'
import {
  RATE_LIMIT_GENERATE_PER_USER_PER_MIN,
  RATE_LIMIT_OAUTH_PER_IP_PER_MIN,
} from '@postari/shared'

export const generateRateLimit = rateLimit({
  windowMs: 60_000,
  limit: RATE_LIMIT_GENERATE_PER_USER_PER_MIN,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.auth?.userId ?? req.ip ?? 'anon',
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: '少し時間をおいてから再度お試しください',
    },
  },
})

export const oauthRateLimit = rateLimit({
  windowMs: 60_000,
  limit: RATE_LIMIT_OAUTH_PER_IP_PER_MIN,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? 'anon',
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'しばらく時間をおいてから再度お試しください',
    },
  },
})
