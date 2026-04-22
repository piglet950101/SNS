import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'

export function TrialBadge({
  remaining,
  total,
  className,
}: {
  remaining: number
  total: number
  className?: string
}) {
  const exhausted = remaining <= 0
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium',
        exhausted
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-primary-200 bg-primary-50 text-primary-700',
        className,
      )}
      role="status"
    >
      <Sparkles className="h-4 w-4" aria-hidden />
      {exhausted
        ? `無料体験を使い切りました`
        : `無料体験 残り ${remaining} 回 (${total}回中)`}
    </div>
  )
}
