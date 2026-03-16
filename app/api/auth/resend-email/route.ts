import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Resend email confirmation using Supabase admin API
    const { error } = await supabase.auth.admin.sendRawEmail({
      email: email,
      html: `
        <h1>Confirm your email</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback">
          Verify Email
        </a>
      `,
    })

    if (error) {
      console.error('[v0] Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to resend email', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Verification email sent to ${email}`,
    })
  } catch (error) {
    console.error('[v0] Resend email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
