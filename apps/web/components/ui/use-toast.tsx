'use client'

import * as React from 'react'

// Minimal useToast — supports up to 3 concurrent toasts.
interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'destructive'
}

interface ToastContext {
  toasts: Toast[]
  toast: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const Ctx = React.createContext<ToastContext | null>(null)

export function ToastContextProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const toast = React.useCallback((t: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((prev) => [...prev.slice(-2), { ...t, id }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4_000)
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  return <Ctx.Provider value={{ toasts, toast, dismiss }}>{children}</Ctx.Provider>
}

export function useToast() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used within ToastContextProvider')
  return ctx
}
