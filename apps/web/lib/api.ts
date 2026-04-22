import { auth } from '@clerk/nextjs/server'

/**
 * Server-side API client — reads the user's Clerk JWT on the server and
 * forwards it to apps/api as a Bearer token.
 *
 * Use this from Server Components and route handlers.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit & { token?: string },
): Promise<T> {
  const base = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
  let token = init?.token
  if (!token) {
    const { getToken } = auth()
    token = (await getToken()) ?? undefined
  }
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`API ${res.status}: ${text}`)
    ;(err as Error & { status: number }).status = res.status
    throw err
  }
  return (await res.json()) as T
}
