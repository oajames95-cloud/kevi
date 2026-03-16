import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Handle errors
  if (error) {
    const url = new URL('/auth/error', request.nextUrl.origin)
    url.searchParams.set('error', error)
    if (error_description) {
      url.searchParams.set('error_description', error_description)
    }
    return NextResponse.redirect(url)
  }

  // Handle successful authentication
  if (code) {
    const supabase = await createClient()

    const { error: codeExchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (codeExchangeError) {
      const url = new URL('/auth/error', request.nextUrl.origin)
      url.searchParams.set('error', 'code_exchange_failed')
      url.searchParams.set('error_description', codeExchangeError.message)
      return NextResponse.redirect(url)
    }

    // Check if user needs onboarding (no rep record)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: rep } = await supabase
        .from('reps')
        .select('id')
        .eq('supabase_user_id', user.id)
        .single()

      if (!rep) {
        // User needs onboarding
        return NextResponse.redirect(new URL('/onboarding', request.nextUrl.origin))
      }
    }

    // Redirect to dashboard on successful email verification
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl.origin))
  }

  // No code or error - redirect home
  return NextResponse.redirect(new URL('/', request.nextUrl.origin))
}
