import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'node:crypto'
import { env } from '../env'

const e = env()

const endpoint = e.R2_ENDPOINT ?? `https://${e.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`

export const r2 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: e.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: e.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

export interface SignedUploadResult {
  uploadUrl: string
  publicUrl: string
  key: string
}

export async function createSignedUploadUrl(
  userId: string,
  filename: string,
  contentType: string,
): Promise<SignedUploadResult> {
  const ext = filename.includes('.') ? filename.split('.').pop() : 'jpg'
  const key = `uploads/${userId}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`

  const cmd = new PutObjectCommand({
    Bucket: e.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    // Tag new uploads so Cloudflare lifecycle can cull unattached objects later.
    Tagging: 'ephemeral=true',
  })

  const uploadUrl = await getSignedUrl(r2, cmd, { expiresIn: 600 })
  const publicUrl = `${e.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
  return { uploadUrl, publicUrl, key }
}
