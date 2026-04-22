'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { useApi, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { TrialBadge } from '@/components/trial-badge'
import { ImagePicker, type PickedImage } from '@/components/image-picker'
import type { StoreDTO, TrialStatusDTO } from '@postari/shared'

export default function PostPage() {
  const api = useApi()
  const router = useRouter()
  const [stores, setStores] = React.useState<StoreDTO[] | null>(null)
  const [trial, setTrial] = React.useState<TrialStatusDTO | null>(null)
  const [storeId, setStoreId] = React.useState<string>('')
  const [images, setImages] = React.useState<PickedImage[]>([])
  const [hint, setHint] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [storesRes, countRes, subRes] = await Promise.all([
          api<{ stores: StoreDTO[] }>('/api/stores'),
          api<{ remaining: number; total: number }>('/api/posts/generate/count'),
          api<{ subscription: unknown }>('/api/billing/subscription'),
        ])
        if (cancelled) return
        setStores(storesRes.stores)
        if (storesRes.stores[0]) setStoreId(storesRes.stores[0].id)
        const isTrial = !subRes.subscription
        setTrial({
          isTrial,
          remaining: countRes.remaining,
          limit: countRes.total,
          exhausted: isTrial && countRes.remaining <= 0,
        })
      } catch {
        // fall through — form will show error on submit
      }
    })()
    return () => {
      cancelled = true
    }
  }, [api])

  const uploaded = images.filter((i) => !i.uploading && i.publicUrl)
  const anyUploading = images.some((i) => i.uploading)
  const trialExhausted = trial?.isTrial && trial?.exhausted
  const canSubmit =
    !submitting && !anyUploading && uploaded.length > 0 && !!storeId && !trialExhausted

  async function submit() {
    setErr(null)
    setSubmitting(true)
    try {
      const res = await api<{ postId: string; isTrial: boolean }>('/api/posts/generate', {
        method: 'POST',
        body: JSON.stringify({
          storeId,
          imageUrls: uploaded.map((i) => i.publicUrl),
          hint: hint.trim() || undefined,
        }),
      })
      router.push(`/post/loading?id=${res.postId}`)
    } catch (e) {
      if (e instanceof ApiClientError && e.code === 'TRIAL_EXHAUSTED') {
        router.push('/billing/setup')
        return
      }
      setErr(e instanceof ApiClientError ? e.message : '投稿に失敗しました')
      setSubmitting(false)
    }
  }

  if (stores === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>店舗情報が必要です</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full">
            <Link href="/onboarding/store">店舗情報を登録</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {trial?.isTrial && <TrialBadge remaining={trial.remaining} total={trial.limit} />}

      <Card>
        <CardHeader>
          <CardTitle>新しい投稿</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stores.length > 1 && (
            <div>
              <Label>投稿先の店舗</Label>
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-input bg-white px-3"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}（{s.area}）
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label>画像</Label>
            <div className="mt-1">
              <ImagePicker images={images} onChange={setImages} />
            </div>
          </div>

          <div>
            <Label htmlFor="hint">ヒント（任意）</Label>
            <Textarea
              id="hint"
              placeholder="例：今日の限定パフェ / 新メニュー / イベント告知など"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              maxLength={500}
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">{hint.length} / 500</p>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          {trialExhausted ? (
            <Button asChild size="lg" className="w-full">
              <Link href="/billing/setup">プランに加入して続ける</Link>
            </Button>
          ) : (
            <Button size="lg" className="w-full" disabled={!canSubmit} onClick={submit}>
              <Sparkles className="h-5 w-5" />
              {submitting ? 'AIが生成中…' : '投稿する'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
