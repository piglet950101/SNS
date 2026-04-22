'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { BUSINESS_TYPE_LABELS } from '@postari/shared'
import { useApi, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function OnboardingStorePage() {
  const router = useRouter()
  const api = useApi()
  const [name, setName] = React.useState('')
  const [businessType, setBusinessType] = React.useState<string>('concept_cafe')
  const [area, setArea] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      const res = await api<{ store: { id: string } }>('/api/stores', {
        method: 'POST',
        body: JSON.stringify({ name, businessType, area }),
      })
      router.push(`/onboarding/x?storeId=${res.store.id}`)
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : '保存に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>店舗情報を入力</CardTitle>
        <CardDescription>
          AI が生成する投稿文をこの情報で最適化します。後から変更できます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">店舗名</Label>
            <Input
              id="name"
              maxLength={100}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：カフェ〇〇"
            />
          </div>
          <div>
            <Label htmlFor="biz">業態</Label>
            <Select value={businessType} onValueChange={setBusinessType}>
              <SelectTrigger id="biz">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="area">エリア</Label>
            <Input
              id="area"
              maxLength={100}
              required
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="例：池袋、秋葉原、渋谷など"
            />
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? '保存中…' : '次へ：Xを連携'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
