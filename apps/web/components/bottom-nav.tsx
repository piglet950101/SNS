'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Clock, PlusSquare, Settings } from 'lucide-react'
import { cn } from '@/lib/cn'

const ITEMS = [
  { href: '/post', label: '投稿', icon: PlusSquare },
  { href: '/history', label: '履歴', icon: Clock },
  { href: '/dashboard', label: 'ダッシュボード', icon: BarChart3 },
  { href: '/settings/sns', label: '設定', icon: Settings },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch">
        {ITEMS.map((item) => {
          const active =
            pathname === item.href || (item.href !== '/post' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors',
                  active ? 'text-primary-600' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
