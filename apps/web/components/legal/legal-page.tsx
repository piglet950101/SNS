import * as React from 'react'

export function LegalPage({
  title,
  subtitle,
  effectiveDate,
  children,
}: {
  title: string
  subtitle?: string
  effectiveDate: string
  children: React.ReactNode
}) {
  return (
    <article className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <p className="mt-3 text-xs text-muted-foreground">
          制定日：{effectiveDate} / 株式会社アテナ
        </p>
      </header>
      <div className="prose prose-sm max-w-none text-foreground md:prose-base [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-semibold [&_p]:leading-relaxed [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-primary-50 [&_th]:p-2 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold [&_th]:text-primary-700 [&_td]:border [&_td]:border-border [&_td]:p-2 [&_td]:text-sm [&_td]:align-top [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-0.5">
        {children}
      </div>
      <footer className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground">
        以上 — 株式会社アテナ
      </footer>
    </article>
  )
}

export function Notice({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'warn' }) {
  const color =
    tone === 'warn'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-primary-200 bg-primary-50 text-primary-900'
  return (
    <aside className={`my-4 rounded-lg border p-3 text-sm ${color}`}>{children}</aside>
  )
}
