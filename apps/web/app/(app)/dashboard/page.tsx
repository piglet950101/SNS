'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { useApi } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrialBadge } from '@/components/trial-badge'
import {
  PLAN_SPECS,
  formatYen,
  relativeTimeJa,
  type DashboardDTO,
} from '@postari/shared'

export default function DashboardPage() {
  const api = useApi()
  const [data, setData] = React.useState<DashboardDTO | null>(null)

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await api<DashboardDTO>('/api/dashboard')
        setData(res)
      } catch {
        /* empty */
      }
    })()
  }, [api])

  if (!data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  const planName = data.plan === 'trial' ? '無料体験' : PLAN_SPECS[data.plan].nameJa
  const daysUntilRenewal = data.subscription
    ? Math.max(
        0,
        Math.ceil((new Date(data.subscription.currentPeriodEnd).getTime() - Date.now()) / 86_400_000),
      )
    : null

  const progress =
    data.usage.limit > 0 ? Math.min(100, Math.round((data.usage.postCount / data.usage.limit) * 100)) : 0

  return (
    <div className="space-y-4">
      {data.trial.isTrial && <TrialBadge remaining={data.trial.remaining} total={data.trial.limit} />}

      {data.tokenWarning && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">
              {data.tokenWarning.platform === 'x' ? 'X' : data.tokenWarning.platform} の認証期限が{' '}
              {data.tokenWarning.daysUntilExpiry} 日以内に切れます
            </p>
            <Link href="/settings/sns" className="text-xs underline">
              今すぐ再連携する
            </Link>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">現在のプラン</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{planName}</p>
          {daysUntilRenewal !== null && (
            <p className="text-xs text-muted-foreground">次回更新まで {daysUntilRenewal} 日</p>
          )}
          {data.plan !== 'trial' && (
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/settings/sns">請求・解約を管理</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">今月の利用状況</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {data.usage.postCount}
            {data.usage.limit > 0 && ` / ${data.usage.limit}`} 投稿
          </p>
          {data.usage.limit > 0 && (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {data.usage.overageCount > 0 && (
            <p className="mt-2 text-xs text-amber-700">
              超過 {data.usage.overageCount} 投稿 × ¥150 = {formatYen(data.usage.overageCount * 150)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">最近の投稿</CardTitle>
          <Link href="/history" className="text-xs text-primary-600 underline">
            すべて見る
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.recentPosts.length === 0 && (
            <p className="text-sm text-muted-foreground">まだ投稿がありません</p>
          )}
          {data.recentPosts.map((p) => {
            const xResult = p.results.find((r) => r.platform === 'x')
            const text = p.editedForX ?? p.generatedForX ?? ''
            return (
              <Link
                key={p.id}
                href={`/history#${p.id}`}
                className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/60"
              >
                {p.imageUrls[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrls[0]}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-md object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm">{text.slice(0, 80)}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{relativeTimeJa(p.createdAt)}</span>
                    {xResult?.status === 'success' && (
                      <>
                        <span>·</span>
                        <span className="text-green-700">X ✓</span>
                        {xResult.externalUrl && <ExternalLink className="h-3 w-3" />}
                      </>
                    )}
                    {xResult?.status === 'failed' && <span className="text-red-700">X ✗</span>}
                  </div>
                </div>
              </Link>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
