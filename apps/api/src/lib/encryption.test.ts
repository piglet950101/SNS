import { describe, expect, it, beforeAll } from 'vitest'
import crypto from 'node:crypto'
import { decrypt, encrypt } from './encryption'

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64')
  // Other required env for env() — minimal stubs:
  Object.assign(process.env, {
    NODE_ENV: 'test',
    APP_URL: 'http://localhost:3000',
    DATABASE_URL: 'postgres://test@localhost/test',
    REDIS_URL: 'redis://localhost:6379',
    CLERK_SECRET_KEY: 'sk_test_dummy',
    CLERK_WEBHOOK_SECRET: 'whsec_dummy',
    R2_ACCOUNT_ID: 'x',
    R2_ACCESS_KEY_ID: 'x',
    R2_SECRET_ACCESS_KEY: 'x',
    R2_BUCKET: 'x',
    R2_PUBLIC_URL: 'https://example.com',
    ANTHROPIC_API_KEY: 'sk-ant-dummy',
    X_OAUTH_CLIENT_ID: 'x',
    X_OAUTH_CLIENT_SECRET: 'x',
    X_OAUTH_CALLBACK_URL: 'http://localhost:3000/cb',
    STRIPE_SECRET_KEY: 'sk_test_dummy',
    STRIPE_WEBHOOK_SECRET: 'whsec_dummy',
    STRIPE_PRICE_STARTER_MONTHLY: 'price_x',
    STRIPE_PRICE_STANDARD_MONTHLY: 'price_x',
    STRIPE_PRICE_PRO_MONTHLY: 'price_x',
    STRIPE_PRICE_STARTER_ANNUAL: 'price_x',
    STRIPE_PRICE_STANDARD_ANNUAL: 'price_x',
    STRIPE_PRICE_PRO_ANNUAL: 'price_x',
    STRIPE_PRICE_OVERAGE: 'price_x',
  })
})

describe('encryption', () => {
  it('round-trips ASCII', () => {
    const ct = encrypt('hello world')
    expect(decrypt(ct)).toBe('hello world')
  })

  it('round-trips Japanese', () => {
    const s = '秋葉原のコンセプトカフェです🍰'
    expect(decrypt(encrypt(s))).toBe(s)
  })

  it('produces unique ciphertext per call (fresh IV)', () => {
    const a = encrypt('same')
    const b = encrypt('same')
    expect(a).not.toBe(b)
  })

  it('fails on tampered ciphertext', () => {
    const ct = encrypt('secret')
    const buf = Buffer.from(ct, 'base64')
    buf[buf.length - 1] = buf[buf.length - 1]! ^ 0xff
    expect(() => decrypt(buf.toString('base64'))).toThrow()
  })
})
