import crypto from 'node:crypto'
import { env } from '../env'

// -----------------------------------------------------------------------------
// X OAuth 2.0 PKCE helpers.
// -----------------------------------------------------------------------------

const TOKEN_URL = 'https://api.twitter.com/2/oauth2/token'
const AUTH_URL = 'https://twitter.com/i/oauth2/authorize'
const REQUIRED_SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access']

export interface PkceChallenge {
  codeVerifier: string
  codeChallenge: string
  state: string
}

export function createPkceChallenge(): PkceChallenge {
  const codeVerifier = base64url(crypto.randomBytes(64))
  const codeChallenge = base64url(
    crypto.createHash('sha256').update(codeVerifier).digest(),
  )
  const state = base64url(crypto.randomBytes(24))
  return { codeVerifier, codeChallenge, state }
}

export function buildAuthorizeUrl(challenge: PkceChallenge): string {
  const e = env()
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: e.X_OAUTH_CLIENT_ID,
    redirect_uri: e.X_OAUTH_CALLBACK_URL,
    scope: REQUIRED_SCOPES.join(' '),
    state: challenge.state,
    code_challenge: challenge.codeChallenge,
    code_challenge_method: 'S256',
  })
  return `${AUTH_URL}?${params.toString()}`
}

export interface XTokenResponse {
  token_type: 'bearer'
  expires_in: number
  access_token: string
  scope: string
  refresh_token?: string
}

async function postTokenForm(body: URLSearchParams): Promise<XTokenResponse> {
  const e = env()
  const basic = Buffer.from(`${e.X_OAUTH_CLIENT_ID}:${e.X_OAUTH_CLIENT_SECRET}`).toString('base64')
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
    throw new Error(`X token endpoint ${res.status}: ${text}`)
  }
  return (await res.json()) as XTokenResponse
}

export async function exchangeCodeForTokens(params: {
  code: string
  codeVerifier: string
}): Promise<XTokenResponse> {
  const e = env()
  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: e.X_OAUTH_CALLBACK_URL,
    client_id: e.X_OAUTH_CLIENT_ID,
    code_verifier: params.codeVerifier,
  })
  return postTokenForm(form)
}

export async function refreshAccessToken(refreshToken: string): Promise<XTokenResponse> {
  const e = env()
  const form = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: e.X_OAUTH_CLIENT_ID,
  })
  return postTokenForm(form)
}

export async function fetchXUsername(accessToken: string): Promise<string | null> {
  const res = await fetch('https://api.twitter.com/2/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  const json = (await res.json()) as { data?: { username?: string } }
  return json.data?.username ?? null
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
