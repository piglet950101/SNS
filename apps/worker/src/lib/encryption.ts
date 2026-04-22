import crypto from 'node:crypto'
import { env } from '../env'

const IV = 12
const TAG = 16

function key(): Buffer {
  const buf = Buffer.from(env().TOKEN_ENCRYPTION_KEY, 'base64')
  if (buf.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must decode to 32 bytes')
  return buf
}

export function encrypt(s: string): string {
  const iv = crypto.randomBytes(IV)
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([c.update(s, 'utf8'), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64')
}

export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, 'base64')
  const iv = buf.subarray(0, IV)
  const tag = buf.subarray(IV, IV + TAG)
  const enc = buf.subarray(IV + TAG)
  const d = crypto.createDecipheriv('aes-256-gcm', key(), iv)
  d.setAuthTag(tag)
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8')
}
