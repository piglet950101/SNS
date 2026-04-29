import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ToastContextProvider } from '@/components/ui/use-toast'
import { Toaster } from '@/components/toaster'
import './globals.css'

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Postari | お店の投稿をAIでカンタン自動化',
    template: '%s | Postari',
  },
  description:
    'コンセプトカフェ・メイドカフェ・飲食店向けのSNS自動投稿サービス。写真を選ぶだけでX用の投稿文をAIが自動生成。景品表示法対応済み。',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://postari.jp'),
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'Postari',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#FF6B4A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#FF6B4A',
          colorText: '#1A1A2E',
          borderRadius: '0.5rem',
          fontFamily: 'var(--font-noto-sans-jp), Hiragino Kaku Gothic ProN, system-ui, sans-serif',
        },
      }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html lang="ja" className={notoSansJp.variable} translate="no">
        <head>
          {/* Disable browser auto-translate (Chrome / Edge / Safari).
              React 18 hydration breaks when translation rewrites text nodes
              before hydration runs (errors #418 / #423). Site is JP-only. */}
          <meta name="google" content="notranslate" />
        </head>
        <body className="min-h-[100dvh]" translate="no">
          <ToastContextProvider>
            {children}
            <Toaster />
          </ToastContextProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
