import { env } from '../env'

// -----------------------------------------------------------------------------
// X (Twitter) v2 API helpers used by the post:x job.
// -----------------------------------------------------------------------------

const TOKEN_URL = 'https://api.twitter.com/2/oauth2/token'

export interface XTokenResponse {
  token_type: 'bearer'
  expires_in: number
  access_token: string
  scope: string
  refresh_token?: string
}

export async function refreshAccessToken(refreshToken: string): Promise<XTokenResponse> {
  const e = env()
  const basic = Buffer.from(`${e.X_OAUTH_CLIENT_ID}:${e.X_OAUTH_CLIENT_SECRET}`).toString('base64')
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: e.X_OAUTH_CLIENT_ID,
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`X refresh failed (${res.status}): ${text}`)
  }
  return (await res.json()) as XTokenResponse
}

/**
 * Download an image from R2 (public URL), upload it to X v2 media endpoint,
 * and return the media_id string. v2 `/2/media/upload` accepts OAuth 2.0
 * Bearer tokens; v1.1 does not, so v2 is required for our PKCE flow.
 */
export async function uploadMediaFromUrl(accessToken: string, imageUrl: string): Promise<string> {
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error(`failed to download image: ${imgRes.status}`)
  const buf = Buffer.from(await imgRes.arrayBuffer())

  const form = new FormData()
  const blob = new Blob([buf], { type: imgRes.headers.get('content-type') ?? 'image/jpeg' })
  form.append('media', blob)
  form.append('media_category', 'tweet_image')

  const res = await fetch('https://api.x.com/2/media/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`X media upload failed (${res.status}): ${text}`)
  }
  const j = (await res.json()) as {
    media_id_string?: string
    data?: { id?: string }
  }
  const id = j.media_id_string ?? j.data?.id
  if (!id) throw new Error('X media upload returned no media_id')
  return id
}

export interface PostTweetResult {
  tweetId: string
  username: string | null
}

export async function postTweet(
  accessToken: string,
  text: string,
  mediaIds: string[],
): Promise<PostTweetResult> {
  const body: Record<string, unknown> = { text }
  if (mediaIds.length > 0) body.media = { media_ids: mediaIds }

  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (res.status === 401) {
    const err = new Error('X auth expired')
    ;(err as Error & { code?: string }).code = 'TOKEN_EXPIRED'
    throw err
  }
  if (res.status === 429) {
    const err = new Error('X rate limit')
    ;(err as Error & { code?: string }).code = 'RATE_LIMITED'
    throw err
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`X tweet failed (${res.status}): ${text}`)
  }
  const j = (await res.json()) as { data: { id: string; text: string } }

  const me = await fetch('https://api.twitter.com/2/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  let username: string | null = null
  if (me.ok) {
    const ju = (await me.json()) as { data?: { username?: string } }
    username = ju.data?.username ?? null
  }
  return { tweetId: j.data.id, username }
}

export function tweetUrl(username: string | null, tweetId: string): string {
  if (!username) return `https://twitter.com/i/web/status/${tweetId}`
  return `https://twitter.com/${username}/status/${tweetId}`
}
