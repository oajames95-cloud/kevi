import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List invites for the company
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: invites, error } = await supabase
      .from('invite_tokens')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ invites })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new invite
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current user's rep record to verify admin role
    const { data: currentRep } = await supabase
      .from('reps')
      .select('id, company_id, role')
      .eq('supabase_user_id', user.id)
      .single()

    if (!currentRep || currentRep.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create invites' }, { status: 403 })
    }

    const body = await request.json()
    const { email, role = 'rep' } = body

    // Create invite token
    const { data: invite, error } = await supabase
      .from('invite_tokens')
      .insert({
        company_id: currentRep.company_id,
        email: email || null,
        role,
        created_by: currentRep.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ invite })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
