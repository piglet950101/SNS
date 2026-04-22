import Link from 'next/link'
import { PostariLogo } from '@/components/postari-logo'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-muted/30">
      <header className="border-b border-border bg-white">
        <div className="container mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Link href="/">
            <PostariLogo />
          </Link>
          <span className="text-xs text-muted-foreground">初期設定</span>
        </div>
      </header>
      <main className="flex-1 py-6">
        <div className="container mx-auto max-w-md px-4">{children}</div>
      </main>
    </div>
  )
}
