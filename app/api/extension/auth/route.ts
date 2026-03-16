import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/extension/auth - Authenticate extension with email/password and return extension token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get the rep record with the extension token
    const { data: rep, error: repError } = await supabase
      .from('reps')
      .select('id, name, extension_token')
      .eq('supabase_user_id', authData.user.id)
      .single()

    if (repError || !rep) {
      return NextResponse.json(
        { error: 'Rep profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      extension_token: rep.extension_token,
      name: rep.name,
    })
  } catch (error) {
    console.error('Extension auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
