'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

export function useApi() {
  const { getToken } = useAuth()

  return useCallback(
    async <T = unknown>(path: string, init?: RequestInit): Promise<T> => {
      const token = await getToken()
      const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init?.headers ?? {}),
        },
      })
      if (!res.ok) {
        let payload: { error?: { code?: string; message?: string; details?: unknown } } = {}
        try {
          payload = await res.json()
        } catch {
          /* empty body */
        }
        throw new ApiClientError(
          res.status,
          payload.error?.code ?? 'UNKNOWN',
          payload.error?.message ?? `HTTP ${res.status}`,
          payload.error?.details,
        )
      }
      const text = await res.text()
      return text ? (JSON.parse(text) as T) : (undefined as T)
    },
    [getToken],
  )
}
