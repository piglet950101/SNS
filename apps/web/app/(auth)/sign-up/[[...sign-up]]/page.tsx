'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SignUp, useSignUp } from '@clerk/nextjs'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Signup screen (②).
 *
 * Three required consent checkboxes below the Clerk form. Clerk itself
 * handles phone verification (must be enabled as "Required" in the Clerk
 * dashboard per §9.1). The checkboxes gate an invisible overlay over Clerk's
 * form so the user cannot submit until all 3 are ticked.
 */
export default function SignUpPage() {
  const router = useRouter()
  const { isLoaded, signUp } = useSignUp()
  const [consent, setConsent] = React.useState({
    age: false,
    antisocial: false,
    terms: false,
  })
  const allConsented = consent.age && consent.antisocial && consent.terms

  // When Clerk signup completes, route to onboarding. The Clerk webhook will
  // have run on the server to insert the users row with consent stamps.
  React.useEffect(() => {
    if (!isLoaded) return
    if (signUp?.status === 'complete') {
      router.replace('/onboarding/store')
    }
  }, [isLoaded, signUp, router])

  return (
    <div className="w-full max-w-md px-4">
      <h1 className="mb-4 text-center text-xl font-bold">アカウント作成</h1>

      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ご利用前の確認</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-5">
          <Checkbox
            checked={consent.age}
            onChange={(e) => setConsent((c) => ({ ...c, age: e.target.checked }))}
            label={
              <>
                <strong>18歳以上</strong>であることを確認しました（利用規約第3条）
              </>
            }
          />
          <Checkbox
            checked={consent.antisocial}
            onChange={(e) => setConsent((c) => ({ ...c, antisocial: e.target.checked }))}
            label={
              <>
                <strong>反社会的勢力ではない</strong>ことを表明・保証します（利用規約第13条）
              </>
            }
          />
          <Checkbox
            checked={consent.terms}
            onChange={(e) => setConsent((c) => ({ ...c, terms: e.target.checked }))}
            label={
              <>
                <Link href="/legal/terms" target="_blank" className="text-primary-600 underline">
                  利用規約
                </Link>{' '}
                および{' '}
                <Link href="/legal/privacy" target="_blank" className="text-primary-600 underline">
                  プライバシーポリシー
                </Link>
                に同意します
              </>
            }
          />
        </CardContent>
      </Card>

      <div className="relative">
        <div aria-hidden={allConsented} className={allConsented ? '' : 'pointer-events-none opacity-40'}>
          <SignUp
            appearance={{
              elements: { rootBox: 'mx-auto', card: 'shadow-none bg-transparent' },
            }}
            signInUrl="/sign-in"
            redirectUrl="/onboarding/store"
          />
        </div>
        {!allConsented && (
          <div className="mt-3 rounded-lg border border-primary-200 bg-primary-50 p-3 text-center text-sm text-primary-700">
            3つすべてにチェックを入れるとアカウント作成に進めます
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        電話番号の確認はアカウント作成時に必要です（多重登録防止のため）。
      </p>
    </div>
  )
}
