'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { useApi } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { relativeTimeJa, type PostDTO } from '@postari/shared'

export default function HistoryPage() {
  const api = useApi()
  const [posts, setPosts] = React.useState<PostDTO[]>([])
  const [cursor, setCursor] = React.useState<string | null>(null)
  const [hasMore, setHasMore] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [initial, setInitial] = React.useState(true)
  const [selected, setSelected] = React.useState<PostDTO | null>(null)
  const sentinelRef = React.useRef<HTMLDivElement>(null)

  const loadMore = React.useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (cursor) qs.set('cursor', cursor)
      qs.set('limit', '20')
      const res = await api<{ posts: PostDTO[]; nextCursor: string | null }>(
        `/api/posts/history?${qs.toString()}`,
      )
      setPosts((prev) => [...prev, ...res.posts])
      setCursor(res.nextCursor)
      setHasMore(!!res.nextCursor)
    } finally {
      setLoading(false)
      setInitial(false)
    }
  }, [api, cursor, hasMore, loading])

  React.useEffect(() => {
    void loadMore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (!sentinelRef.current || !hasMore) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadMore()
    })
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [loadMore, hasMore])

  if (initial) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          まだ投稿がありません
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <ul className="space-y-2">
        {posts.map((p) => {
          const xResult = p.results.find((r) => r.platform === 'x')
          const text = p.editedForX ?? p.generatedForX ?? ''
          return (
            <li key={p.id} id={p.id}>
              <button
                type="button"
                onClick={() => setSelected(p)}
                className="flex w-full items-start gap-3 rounded-lg border border-border bg-white p-3 text-left hover:bg-muted/60"
              >
                {p.imageUrls[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrls[0]}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-md object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm">{text.slice(0, 80)}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{relativeTimeJa(p.createdAt)}</span>
                    {xResult?.status === 'success' && (
                      <Badge variant="success">X ✓</Badge>
                    )}
                    {xResult?.status === 'failed' && <Badge variant="destructive">X ✗</Badge>}
                    {!xResult && p.isTrial && <Badge variant="muted">無料体験</Badge>}
                    {!xResult && !p.isTrial && <Badge variant="muted">下書き</Badge>}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
      <div ref={sentinelRef} className="flex justify-center py-4">
        {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        {!hasMore && !loading && (
          <span className="text-xs text-muted-foreground">これ以上ありません</span>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>投稿の詳細</DialogTitle>
            <DialogDescription>
              {selected && relativeTimeJa(selected.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              <p className="whitespace-pre-wrap text-sm">
                {selected.editedForX ?? selected.generatedForX}
              </p>
              {selected.imageUrls.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {selected.imageUrls.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={url}
                      src={url}
                      alt=""
                      className="h-24 w-24 shrink-0 rounded-md object-cover"
                    />
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {selected.results.map((r) => (
                  <Badge
                    key={r.id}
                    variant={r.status === 'success' ? 'success' : 'destructive'}
                  >
                    {r.platform.toUpperCase()} {r.status === 'success' ? '✓' : '✗'}
                    {r.externalUrl && (
                      <a href={r.externalUrl} target="_blank" rel="noreferrer" className="ml-1 underline">
                        開く
                      </a>
                    )}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
