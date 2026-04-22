'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function PlatformCard({
  name,
  logo,
  children,
  blurred = false,
  upgradeHref = '/billing/setup',
}: {
  name: string
  logo: React.ReactNode
  children: React.ReactNode
  blurred?: boolean
  upgradeHref?: string
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-muted">{logo}</div>
        <CardTitle className="text-base">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('transition', blurred && 'pointer-events-none select-none blur-md')}>
          {children}
        </div>
      </CardContent>

      {blurred && (
        <Link
          href={upgradeHref}
          className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[1px]"
          aria-label={`${name} にアップグレードしてすべての媒体に投稿`}
        >
          <div className="mx-4 rounded-xl border border-primary-200 bg-white px-4 py-3 text-center shadow-md">
            <Lock className="mx-auto h-5 w-5 text-primary-600" aria-hidden />
            <p className="mt-1 text-sm font-semibold text-foreground">
              プランに加入すると
              <br />
              全媒体に自動投稿できます
            </p>
            <p className="mt-1 text-xs text-primary-700 underline">料金プランを見る →</p>
          </div>
        </Link>
      )}
    </Card>
  )
}
