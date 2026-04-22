import Image from 'next/image'
import { cn } from '@/lib/cn'

/**
 * Postari brand lockup.
 *   - `variant="mark"` — the 4-square icon only (app icon, favicon, avatars).
 *   - `variant="full"` (default) — the horizontal wordmark (4-square + "Postari").
 *
 * Source files live in `/public/logo-mark.jpg` and `/public/logo-full.jpg`
 * (client-provided 2026-04-21). Swap with SVG variants when available.
 */
export function PostariLogo({
  className,
  size = 28,
  variant = 'full',
}: {
  className?: string
  size?: number
  variant?: 'mark' | 'full'
}) {
  if (variant === 'mark') {
    return (
      <Image
        src="/logo-mark.jpg"
        alt="Postari"
        width={size}
        height={size}
        className={cn('rounded-lg', className)}
        priority
      />
    )
  }

  // Full lockup: logo-full.jpg is ~2816 × 860 (aspect ≈ 3.27).
  // Height = size, width derived to keep aspect.
  const height = size
  const width = Math.round(size * 3.27)
  return (
    <Image
      src="/logo-full.jpg"
      alt="Postari"
      width={width}
      height={height}
      className={cn('h-auto', className)}
      priority
      style={{ height: size, width: 'auto' }}
    />
  )
}
