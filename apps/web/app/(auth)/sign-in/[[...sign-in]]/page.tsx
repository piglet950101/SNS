import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="w-full max-w-md px-4">
      <h1 className="mb-4 text-center text-xl font-bold">ログイン</h1>
      <SignIn
        appearance={{
          elements: { rootBox: 'mx-auto', card: 'shadow-none bg-transparent' },
        }}
        signUpUrl="/sign-up"
      />
    </div>
  )
}
