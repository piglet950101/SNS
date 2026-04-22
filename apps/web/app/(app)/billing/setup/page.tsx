'use client'

import * as React from 'react'
import { Check, Loader2 } from 'lucide-react'
import { useApi, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ANNUAL_DISCOUNT_PERCENT, PLAN_SPECS, formatYen, type Plan } from '@postari/shared'
import { cn } from '@/lib/cn'

export default function BillingSetupPage() {
  const api = useApi()
  const [annual, setAnnual] = React.useState(false)
  const [busyPlan, setBusyPlan] = React.useState<Plan | null>(null)
  const [err, setErr] = React.useState<string | null>(null)

  async function go(plan: Plan) {
    setBusyPlan(plan)
    setErr(null)
    try {
      const { url } = await api<{ url: string }>('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan, interval: annual ? 'year' : 'month' }),
      })
      window.location.href = url
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : '処理に失敗しました')
      setBusyPlan(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">プランを選ぶ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          いつでも変更・解約できます。年額プランは{ANNUAL_DISCOUNT_PERCENT}% OFF。
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-white p-3">
        <span className={cn('text-sm', !annual && 'font-semibold')}>月額</span>
        <Switch checked={annual} onCheckedChange={setAnnual} />
        <span className={cn('text-sm', annual && 'font-semibold')}>
          年額
          <span className="ml-1 text-xs font-semibold text-primary-600">-{ANNUAL_DISCOUNT_PERCENT}%</span>
        </span>
      </div>

      {Object.values(PLAN_SPECS).map((p) => {
        const price = annual ? p.annualEquivMonthlyYen : p.monthlyYen
        const yearlyTotal = p.annualYen
        return (
          <Card key={p.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-primary-600">{p.nameJa}</p>
                  <p className="mt-1 text-2xl font-bold">
                    {formatYen(price)}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">/月（税込）</span>
                  </p>
                  {annual && (
                    <p className="text-xs text-muted-foreground">年額 {formatYen(yearlyTotal)}</p>
                  )}
                </div>
                {p.id === 'standard' && (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                    おすすめ
                  </span>
                )}
              </div>
              <ul className="mt-4 space-y-1.5 text-sm">
                {p.featuresJa.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-4 w-full"
                size="lg"
                onClick={() => go(p.id)}
                disabled={busyPlan !== null}
              >
                {busyPlan === p.id ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  `${p.nameJa}に加入`
                )}
              </Button>
            </CardContent>
          </Card>
        )
      })}

      {err && <p className="text-sm text-red-600">{err}</p>}

      <p className="pt-4 text-center text-xs text-muted-foreground">
        無料体験中に生成された文章は保存されます。プラン加入後にいつでも再利用できます。
      </p>
    </div>
  )
}
