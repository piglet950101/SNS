import Link from 'next/link'
import { PostariLogo } from '@/components/postari-logo'
import { Footer } from '@/components/footer'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="border-b border-border bg-white">
        <div className="container mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/">
            <PostariLogo />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center bg-muted/30 py-8">{children}</main>
      <Footer />
    </div>
  )
}
