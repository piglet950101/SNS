import Link from 'next/link'
import { SUPPORT_EMAIL } from '@postari/shared'

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto max-w-4xl px-4 py-8 text-sm text-muted-foreground">
        <nav className="mb-4 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/legal/tokushoho" className="hover:text-foreground">
            特定商取引法に基づく表記
          </Link>
          <Link href="/legal/privacy" className="hover:text-foreground">
            プライバシーポリシー
          </Link>
          <Link href="/legal/terms" className="hover:text-foreground">
            利用規約
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-foreground">
            {SUPPORT_EMAIL}
          </a>
        </nav>
        {/* suppressHydrationWarning: server/client clock skew across year boundary
            shouldn't trigger React's hydration error path. */}
        <p className="text-xs" suppressHydrationWarning>
          © {new Date().getFullYear()} 株式会社アテナ — Postari
        </p>
      </div>
    </footer>
  )
}
