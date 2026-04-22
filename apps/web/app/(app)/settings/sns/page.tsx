'use client'

import * as React from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useApi, ApiClientError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { BUSINESS_TYPE_LABELS, type StoreDTO } from '@postari/shared'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'

export default function SettingsSnsPage() {
  const api = useApi()
  const { toast } = useToast()
  const [stores, setStores] = React.useState<StoreDTO[] | null>(null)
  const [savingId, setSavingId] = React.useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = React.useState('')
  const [deleting, setDeleting] = React.useState(false)

  const refresh = React.useCallback(async () => {
    const res = await api<{ stores: StoreDTO[] }>('/api/stores')
    setStores(res.stores)
  }, [api])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  async function connectX(storeId: string) {
    try {
      const { url } = await api<{ url: string }>(
        `/api/oauth/x/start?storeId=${encodeURIComponent(storeId)}`,
      )
      window.location.href = url
    } catch (e) {
      toast({
        variant: 'destructive',
        title: '連携に失敗しました',
        description: e instanceof ApiClientError ? e.message : String(e),
      })
    }
  }

  async function disconnectX(storeId: string) {
    if (!confirm('Xとの連携を解除します。よろしいですか？')) return
    try {
      await api(`/api/oauth/x/disconnect?storeId=${encodeURIComponent(storeId)}`, {
        method: 'DELETE',
      })
      toast({ variant: 'success', title: '連携を解除しました' })
      await refresh()
    } catch (e) {
      toast({
        variant: 'destructive',
        title: '解除に失敗しました',
        description: e instanceof ApiClientError ? e.message : String(e),
      })
    }
  }

  async function saveStore(store: StoreDTO, patch: Partial<StoreDTO>) {
    setSavingId(store.id)
    try {
      await api(`/api/stores/${store.id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      toast({ variant: 'success', title: '保存しました' })
      await refresh()
    } catch (e) {
      toast({ variant: 'destructive', title: '保存に失敗しました' })
    } finally {
      setSavingId(null)
    }
  }

  async function openPortal() {
    try {
      const { url } = await api<{ url: string }>('/api/billing/portal', { method: 'POST' })
      window.location.href = url
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Stripe ポータルを開けませんでした',
        description: e instanceof ApiClientError ? e.message : String(e),
      })
    }
  }

  async function requestDeletion() {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)
    try {
      await api('/api/account/request-deletion', { method: 'POST' })
      toast({
        variant: 'success',
        title: 'アカウント削除を受け付けました',
        description: '90日以内に完全に削除されます',
      })
      setTimeout(() => (window.location.href = '/'), 1_500)
    } catch {
      toast({ variant: 'destructive', title: '処理に失敗しました' })
    } finally {
      setDeleting(false)
    }
  }

  if (!stores) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {stores.map((store) => (
        <StoreSection
          key={store.id}
          store={store}
          onConnectX={() => connectX(store.id)}
          onDisconnectX={() => disconnectX(store.id)}
          onSave={(patch) => saveStore(store, patch)}
          saving={savingId === store.id}
        />
      ))}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">請求・解約</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={openPortal} className="w-full">
            Stripe ポータルを開く
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            カード変更・請求書のダウンロード・解約はこちらから。
          </p>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-red-700">危険な操作</CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                アカウントを削除する
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>本当にアカウントを削除しますか？</DialogTitle>
                <DialogDescription>
                  データは 90 日間は復元可能な状態で保持され、その後完全に削除されます。
                  削除中は Postari を利用できません。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="confirm">確認のため「DELETE」と入力してください</Label>
                <Input
                  id="confirm"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                />
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="destructive"
                  onClick={requestDeletion}
                  disabled={deleteConfirm !== 'DELETE' || deleting}
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : '削除を申請する'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-xs text-muted-foreground">
          <Link href="/legal/terms" className="underline">
            利用規約
          </Link>{' '}
          ·{' '}
          <Link href="/legal/privacy" className="underline">
            プライバシーポリシー
          </Link>{' '}
          ·{' '}
          <Link href="/legal/tokushoho" className="underline">
            特商法表記
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

function StoreSection({
  store,
  onConnectX,
  onDisconnectX,
  onSave,
  saving,
}: {
  store: StoreDTO
  onConnectX: () => void
  onDisconnectX: () => void
  onSave: (patch: Partial<StoreDTO>) => Promise<void>
  saving: boolean
}) {
  const [name, setName] = React.useState(store.name)
  const [area, setArea] = React.useState(store.area)
  const [businessType, setBusinessType] = React.useState(store.businessType)

  const dirty =
    name !== store.name || area !== store.area || businessType !== store.businessType

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{store.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">SNS連携</p>
          <div className="mt-2 flex items-center justify-between rounded-lg border border-border p-3">
            <div className="text-sm">
              <p className="font-semibold">X（旧Twitter）</p>
              {store.xConnected ? (
                <p className="text-muted-foreground">@{store.xUsername}</p>
              ) : (
                <p className="text-muted-foreground">未連携</p>
              )}
            </div>
            {store.xConnected ? (
              <Button variant="outline" size="sm" onClick={onDisconnectX}>
                連携解除
              </Button>
            ) : (
              <Button size="sm" onClick={onConnectX}>
                連携する
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">店舗情報</p>
          <div>
            <Label htmlFor={`name-${store.id}`}>店舗名</Label>
            <Input
              id={`name-${store.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>
          <div>
            <Label>業態</Label>
            <Select value={businessType} onValueChange={(v) => setBusinessType(v as StoreDTO['businessType'])}>
              <SelectTrigger>
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
            <Label htmlFor={`area-${store.id}`}>エリア</Label>
            <Input
              id={`area-${store.id}`}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              maxLength={100}
            />
          </div>
          <Button
            size="sm"
            onClick={() => onSave({ name, area, businessType })}
            disabled={!dirty || saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : '保存'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
