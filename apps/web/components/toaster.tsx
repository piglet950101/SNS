'use client'

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './ui/toast'
import { useToast } from './ui/use-toast'

export function Toaster() {
  const { toasts, dismiss } = useToast()
  return (
    <ToastProvider swipeDirection="right">
      {toasts.map((t) => (
        <Toast key={t.id} variant={t.variant} onOpenChange={(o) => !o && dismiss(t.id)} open>
          <div className="grid gap-1">
            {t.title && <ToastTitle className="font-semibold">{t.title}</ToastTitle>}
            {t.description && <ToastDescription className="text-sm">{t.description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
