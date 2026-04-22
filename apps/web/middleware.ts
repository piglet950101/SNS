import { NextResponse, type NextRequest } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/legal/:path*',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/oauth/x/callback',
])

// When Clerk keys are dummy placeholders (local dev without a real Clerk
// instance), fall through to a no-op middleware so the public pages render
// for visual QA. Protected routes will still fail at auth later, which is
// the correct signal to swap in real Clerk keys.
const CLERK_DISABLED =
  !process.env.CLERK_SECRET_KEY ||
  process.env.CLERK_SECRET_KEY.includes('placeholder') ||
  process.env.CLERK_SECRET_KEY === 'sk_test_dev'

const clerkHandler = clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect()
  }
})

export default function middleware(req: NextRequest) {
  if (CLERK_DISABLED) {
    return NextResponse.next()
  }
  return clerkHandler(req, {} as never)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
