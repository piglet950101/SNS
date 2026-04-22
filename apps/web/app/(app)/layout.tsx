import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { PostariLogo } from '@/components/postari-logo'
import { BottomNav } from '@/components/bottom-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
        <div className="container mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Link href="/post" aria-label="投稿">
            <PostariLogo size={26} />
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <main className="flex-1 pb-24">
        <div className="container mx-auto max-w-md px-4 py-4">{children}</div>
      </main>
      <BottomNav />
    </div>
  )
}
