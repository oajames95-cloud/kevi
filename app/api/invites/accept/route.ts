import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, name } = body

    if (!token || !name) {
      return NextResponse.json({ error: 'Token and name are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has a company
    const { data: existingRep } = await supabase
      .from('reps')
      .select('id')
      .eq('supabase_user_id', user.id)
      .single()

    if (existingRep) {
      return NextResponse.json({ error: 'You already belong to a company' }, { status: 400 })
    }

    // Validate invite token
    const { data: invite, error: inviteError } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
    }

    // If invite has a specific email, verify it matches
    if (invite.email && invite.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'This invite is for a different email address' }, { status: 403 })
    }

    // Create rep
    const { data: rep, error: repError } = await supabase
      .from('reps')
      .insert({
        company_id: invite.company_id,
        name,
        email: user.email,
        role: invite.role,
        supabase_user_id: user.id,
      })
      .select()
      .single()

    if (repError) {
      console.error('Rep creation error:', repError)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Mark invite as used
    await supabase
      .from('invite_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invite.id)

    return NextResponse.json({
      success: true,
      rep_id: rep.id,
      extension_token: rep.extension_token,
    })
  } catch (error) {
    console.error('Invite accept error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
