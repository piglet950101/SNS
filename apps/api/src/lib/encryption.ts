import crypto from 'node:crypto'
import { env } from '../env'

// -----------------------------------------------------------------------------
// AES-256-GCM token encryption.
// Format: base64(iv ‖ authTag ‖ ciphertext). 12-byte IV, 16-byte tag.
// Key is TOKEN_ENCRYPTION_KEY (base64 of 32 random bytes).
// -----------------------------------------------------------------------------

const IV_BYTES = 12
const TAG_BYTES = 16

function key(): Buffer {
  const raw = env().TOKEN_ENCRYPTION_KEY
  const buf = Buffer.from(raw, 'base64')
  if (buf.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (base64).')
  }
  return buf
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, 'base64')
  if (buf.length < IV_BYTES + TAG_BYTES + 1) {
    throw new Error('Ciphertext too short')
  }
  const iv = buf.subarray(0, IV_BYTES)
  const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES)
  const enc = buf.subarray(IV_BYTES + TAG_BYTES)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(enc), decipher.final()])
  return dec.toString('utf8')
}
