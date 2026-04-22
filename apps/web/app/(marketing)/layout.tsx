import Link from 'next/link'
import { PostariLogo } from '@/components/postari-logo'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="border-b border-border bg-white/90 backdrop-blur">
        <div className="container mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" aria-label="Postari トップページ">
            <PostariLogo />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">ログイン</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">無料で始める</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
