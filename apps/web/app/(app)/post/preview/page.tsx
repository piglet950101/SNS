'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, Loader2, RotateCcw, Send } from 'lucide-react'
import { useApi, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { PlatformCard } from '@/components/platform-card'
import { GoogleLogo, InstagramLogo, WordPressLogo, XLogo } from '@/components/platform-logos'
import { Skeleton } from '@/components/ui/skeleton'
import { X_TWEET_MAX_LENGTH, countXChars, type PostDTO } from '@postari/shared'
import { cn } from '@/lib/cn'

export default function PreviewPage() {
  const sp = useSearchParams()
  const router = useRouter()
  const api = useApi()
  const postId = sp.get('id')

  const [post, setPost] = React.useState<PostDTO | null>(null)
  const [onTrial, setOnTrial] = React.useState<boolean>(true)
  const [text, setText] = React.useState('')
  const [editing, setEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [publishing, setPublishing] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!postId) return
    void (async () => {
      try {
        const res = await api<{ post: PostDTO; currentlyOnTrial: boolean }>(
          `/api/posts/${postId}`,
        )
        setPost(res.post)
        setOnTrial(res.currentlyOnTrial)
        setText(res.post.editedForX ?? res.post.generatedForX ?? '')
      } catch {
        setErr('投稿の読み込みに失敗しました')
      }
    })()
  }, [api, postId])

  async function saveEdits(next: string) {
    if (!postId) return
    setSaving(true)
    try {
      await api(`/api/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify({ editedForX: next }),
      })
    } finally {
      setSaving(false)
    }
  }

  async function publish() {
    if (!postId || !post) return
    if (onTrial) {
      router.push('/billing/setup')
      return
    }
    setPublishing(true)
    setErr(null)
    try {
      await api(`/api/posts/${postId}/publish`, { method: 'POST' })
      router.replace(`/post/done?id=${postId}`)
    } catch (e) {
      if (e instanceof ApiClientError && e.code === 'TRIAL_EXHAUSTED') {
        router.push('/billing/setup')
        return
      }
      setErr(e instanceof ApiClientError ? e.message : '投稿に失敗しました')
      setPublishing(false)
    }
  }

  if (!post) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const charCount = countXChars(text)
  const over = charCount > X_TWEET_MAX_LENGTH

  return (
    <div className="space-y-4">
      {/* Disclaimer banner (always shown per §6 Screen ⑩) */}
      <div
        role="alert"
        className="flex items-start gap-2 rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm text-primary-900"
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          AIが生成した文章です。投稿前にご確認ください。
        </span>
      </div>

      {/* X card — always fully visible */}
      <PlatformCard name="X（旧Twitter）" logo={<XLogo />}>
        {editing ? (
          <>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => void saveEdits(text)}
              className="min-h-[140px]"
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className={cn(over ? 'text-red-600 font-semibold' : 'text-muted-foreground')}>
                {charCount} / {X_TWEET_MAX_LENGTH} 文字
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const orig = post.generatedForX ?? ''
                    setText(orig)
                    void saveEdits(orig)
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  元に戻す
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '確定'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {charCount} / {X_TWEET_MAX_LENGTH}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                編集
              </Button>
            </div>
          </>
        )}

        {post.imageUrls.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {post.imageUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="h-24 w-24 shrink-0 rounded-lg object-cover"
              />
            ))}
          </div>
        )}
      </PlatformCard>

      {onTrial && (
        <>
          <PlatformCard name="Google ビジネスプロフィール" logo={<GoogleLogo />} blurred>
            <p className="text-sm text-muted-foreground">Google Business 投稿のプレビュー</p>
          </PlatformCard>
          <PlatformCard name="Instagram" logo={<InstagramLogo />} blurred>
            <p className="text-sm text-muted-foreground">Instagram 投稿のプレビュー</p>
          </PlatformCard>
          <PlatformCard name="WordPress" logo={<WordPressLogo />} blurred>
            <p className="text-sm text-muted-foreground">WordPress 投稿のプレビュー</p>
          </PlatformCard>
        </>
      )}

      {err && <p className="text-sm text-red-600">{err}</p>}

      {onTrial ? (
        <Card className="border-primary-200 bg-primary-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">無料体験のプレビューです</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm">
              プランに加入すると、このままワンタップでXに投稿できます。他の媒体への同時投稿も解放されます。
            </p>
            <Button asChild size="lg" className="w-full">
              <Link href="/billing/setup">プランを見る</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Button
          size="lg"
          className="w-full"
          onClick={publish}
          disabled={publishing || over || text.trim().length === 0}
        >
          {publishing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          {publishing ? '投稿処理中…' : '投稿する'}
        </Button>
      )}
    </div>
  )
}
