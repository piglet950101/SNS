'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, ExternalLink } from 'lucide-react'
import { useApi } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { PostDTO } from '@postari/shared'

export default function PostDonePage() {
  const sp = useSearchParams()
  const api = useApi()
  const postId = sp.get('id')
  const [post, setPost] = React.useState<PostDTO | null>(null)

  React.useEffect(() => {
    if (!postId) return
    let cancelled = false
    const tick = async () => {
      try {
        const { post } = await api<{ post: PostDTO }>(`/api/posts/${postId}`)
        if (!cancelled) setPost(post)
      } catch {
        /* will retry */
      }
    }
    void tick()
    // Keep polling until we have a success row (worker may still be processing)
    const int = setInterval(() => {
      if (post?.results.some((r) => r.platform === 'x' && r.status === 'success')) {
        clearInterval(int)
        return
      }
      void tick()
    }, 1_500)
    return () => {
      cancelled = true
      clearInterval(int)
    }
  }, [api, postId, post?.results])

  const xResult = post?.results.find((r) => r.platform === 'x')

  return (
    <div className="space-y-4 pt-4">
      <Card className="text-center">
        <CardContent className="space-y-3 p-6">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="text-lg font-bold">投稿が完了しました</h1>

          {post ? (
            <div className="space-y-2 text-sm">
              {xResult?.status === 'success' ? (
                <div className="flex items-center justify-center gap-2 text-green-700">
                  ✓ X に投稿しました
                  {xResult.externalUrl && (
                    <a
                      href={xResult.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary-600 underline"
                    >
                      投稿を見る <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ) : xResult?.status === 'failed' ? (
                <div className="text-red-600">
                  ✗ X への投稿に失敗しました
                  {xResult.errorMessage && (
                    <p className="text-xs text-muted-foreground">{xResult.errorMessage}</p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">X に投稿中…</p>
              )}
            </div>
          ) : (
            <Skeleton className="mx-auto h-5 w-40" />
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button asChild variant="outline" className="flex-1">
          <Link href="/post">もう1件投稿する</Link>
        </Button>
        <Button asChild className="flex-1">
          <Link href="/dashboard">ダッシュボードへ</Link>
        </Button>
      </div>
    </div>
  )
}
