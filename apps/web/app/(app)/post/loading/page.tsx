'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useApi } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/cn'

const STEPS = [
  '画像を解析中…',
  '業界トレンドを確認中…',
  'X 用の投稿文を生成中…',
  'Google / Instagram / WordPress もプレビュー準備中…',
  '最終チェック中…',
] as const

const MIN_DISPLAY_MS = 3_000

export default function PostLoadingPage() {
  const sp = useSearchParams()
  const router = useRouter()
  const api = useApi()
  const postId = sp.get('id')
  const [currentStep, setCurrentStep] = React.useState(0)
  const [status, setStatus] = React.useState<string>('generating')
  const startRef = React.useRef(Date.now())

  // Step progression — rotates through STEPS until ready.
  React.useEffect(() => {
    const t = setInterval(() => {
      setCurrentStep((c) => (c < STEPS.length - 1 ? c + 1 : c))
    }, 900)
    return () => clearInterval(t)
  }, [])

  // Poll status
  React.useEffect(() => {
    if (!postId) return
    let cancelled = false
    const tick = async () => {
      try {
        const res = await api<{ status: string }>(`/api/posts/${postId}/status`)
        if (cancelled) return
        setStatus(res.status)
        if (res.status === 'preview' || res.status === 'failed') {
          const elapsed = Date.now() - startRef.current
          const wait = Math.max(0, MIN_DISPLAY_MS - elapsed)
          setTimeout(() => {
            if (cancelled) return
            if (res.status === 'preview') router.replace(`/post/preview?id=${postId}`)
            else router.replace(`/post?err=failed`)
          }, wait)
        }
      } catch {
        // retry on next interval
      }
    }
    void tick()
    const int = setInterval(tick, 1_000)
    return () => {
      cancelled = true
      clearInterval(int)
    }
  }, [api, postId, router])

  return (
    <div className="pt-6">
      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="mb-2 flex items-center gap-2 text-primary-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-semibold">AIが生成中です</span>
          </div>
          <ol className="space-y-3">
            {STEPS.map((s, i) => {
              const done = i < currentStep || (i === currentStep && status === 'preview')
              const active = i === currentStep && !done
              return (
                <li
                  key={s}
                  className={cn(
                    'flex items-center gap-3 text-sm transition-colors',
                    done
                      ? 'text-foreground'
                      : active
                        ? 'text-primary-600'
                        : 'text-muted-foreground',
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-primary-600" />
                  ) : active ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="inline-block h-5 w-5 rounded-full border-2 border-muted" />
                  )}
                  <span>{s}</span>
                </li>
              )
            })}
          </ol>
        </CardContent>
      </Card>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        通常 10 〜 15 秒で完了します
      </p>
    </div>
  )
}
