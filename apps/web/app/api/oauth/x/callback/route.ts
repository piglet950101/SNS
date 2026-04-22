import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

/**
 * X redirects back here with ?code=...&state=.... We forward to the Express
 * API which looks up the PKCE verifier in Redis (keyed by `state`) and
 * completes the token exchange, then redirect the user back to the onboarding
 * screen with success state.
 *
 * This route is listed as public in middleware.ts so Clerk doesn't bounce it
 * to /sign-in; but the user's Clerk cookies are still attached to the
 * request, so `auth().getToken()` produces a valid JWT for forwarding.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const errorParam = url.searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/onboarding/x?error=${encodeURIComponent(errorParam)}`, req.url),
    )
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL('/onboarding/x?error=missing_params', req.url))
  }

  const { getToken, userId } = auth()
  if (!userId) {
    // Clerk session expired mid-OAuth. Send them to sign in and we'll bounce back.
    return NextResponse.redirect(new URL('/sign-in?returnTo=/onboarding/x', req.url))
  }
  const token = await getToken()

  const apiBase = process.env.API_URL ?? 'http://localhost:4000'

  const res = await fetch(`${apiBase}/api/oauth/x/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ code, state }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return NextResponse.redirect(
      new URL(`/onboarding/x?error=${encodeURIComponent(text.slice(0, 200))}`, req.url),
    )
  }

  const body = (await res.json()) as { username?: string | null }
  const next = new URL('/onboarding/x', req.url)
  if (body.username) next.searchParams.set('x_connected', body.username)
  return NextResponse.redirect(next)
}
