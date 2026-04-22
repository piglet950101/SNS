'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { useApi, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { XLogo } from '@/components/platform-logos'

export default function OnboardingXPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const storeId = sp.get('storeId')
  const api = useApi()
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)
  const [connected, setConnected] = React.useState<{ username: string } | null>(null)

  React.useEffect(() => {
    const username = sp.get('x_connected')
    if (username) setConnected({ username })
  }, [sp])

  async function connect() {
    if (!storeId) {
      setErr('storeId が指定されていません')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      const { url } = await api<{ url: string }>(
        `/api/oauth/x/start?storeId=${encodeURIComponent(storeId)}`,
      )
      window.location.href = url
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : '接続に失敗しました')
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xと連携する</CardTitle>
        <CardDescription>
          あなたのXアカウントに自動投稿できるよう、安全な認証（OAuth 2.0）で接続します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connected ? (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-green-800">
            <CheckCircle2 className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">連携が完了しました</p>
              <p className="text-xs">@{connected.username}</p>
            </div>
          </div>
        ) : (
          <Button onClick={connect} disabled={busy || !storeId} size="lg" className="w-full">
            <XLogo />
            <span>{busy ? '接続中…' : 'Xと連携する'}</span>
          </Button>
        )}

        {err && <p className="text-sm text-red-600">{err}</p>}

        <div className="space-y-3 text-xs text-muted-foreground">
          <p>✓ 読み取り・投稿のみの最小権限で連携します</p>
          <p>✓ アクセストークンは暗号化して保管します</p>
          <p>✓ 解除はいつでも「設定」から可能です</p>
        </div>

        <div className="flex gap-2 border-t border-border pt-4">
          <Button asChild variant="ghost" className="flex-1">
            <Link href="/post">あとで</Link>
          </Button>
          {connected && (
            <Button onClick={() => router.push('/post')} className="flex-1">
              投稿画面へ
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
