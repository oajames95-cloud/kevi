import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/heartbeat - Receive heartbeat from Chrome extension
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const body = await request.json()

    const supabase = await createClient()

    // Verify token and get rep
    const { data: rep, error: repError } = await supabase
      .from('reps')
      .select('id, company_id')
      .eq('extension_token', token)
      .single()

    if (repError || !rep) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Determine status based on last keystroke
    const now = new Date()
    const lastKeystroke = body.last_keystroke_at ? new Date(body.last_keystroke_at) : null
    const secondsSinceKeystroke = lastKeystroke 
      ? (now.getTime() - lastKeystroke.getTime()) / 1000 
      : Infinity

    let status: 'online' | 'passive' | 'offline' = 'offline'
    if (secondsSinceKeystroke < 60) {
      status = 'online'
    } else if (secondsSinceKeystroke < 300) {
      status = 'passive'
    }

    // Upsert rep_status
    const { error: upsertError } = await supabase
      .from('rep_status')
      .upsert({
        rep_id: rep.id,
        current_domain: body.current_domain || null,
        current_category: body.current_category || null,
        status,
        keystrokes_last_min: body.keystrokes_last_min || 0,
        last_keystroke_at: body.last_keystroke_at || null,
        last_click_at: body.last_click_at || null,
        untrusted_clicks_last_min: body.untrusted_clicks_last_min || 0,
        held_key_events_last_min: body.held_key_events_last_min || 0,
        held_mouse_events_last_min: body.held_mouse_events_last_min || 0,
        today_active_seconds: body.today_active_seconds || 0,
        today_keystrokes: body.today_keystrokes || 0,
        today_meetings: body.today_meetings || 0,
        last_heartbeat_at: now.toISOString(),
        updated_at: now.toISOString(),
      }, { onConflict: 'rep_id' })

    if (upsertError) {
      console.error('Heartbeat upsert error:', upsertError)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    // Update rep's last_seen_at
    await supabase
      .from('reps')
      .update({ last_seen_at: now.toISOString() })
      .eq('id', rep.id)

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('Heartbeat error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
