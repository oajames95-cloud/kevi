import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip middleware for extension API routes
  const { pathname } = request.nextUrl
  if (
    pathname.startsWith('/api/extension-token') ||
    pathname.startsWith('/api/events') ||
    pathname.startsWith('/api/heartbeat')
  ) {
    return
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
