import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { categorizeDomain } from '@/lib/kevi-utils'

// POST /api/events - Ingest activity events from Chrome extension
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  // Get the extension token from the Authorization header
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
  }

  const extensionToken = authHeader.replace('Bearer ', '')

  // Look up the rep by extension token
  const { data: rep, error: repError } = await supabase
    .from('reps')
    .select('id')
    .eq('extension_token', extensionToken)
    .single()

  if (repError || !rep) {
    return NextResponse.json({ error: 'Invalid extension token' }, { status: 401 })
  }

  // Update last_seen_at
  await supabase
    .from('reps')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', rep.id)

  const body = await request.json()
  const { events } = body

  if (!events || !Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: 'Events array is required' }, { status: 400 })
  }

  // Transform and insert events
  const activityEvents = events.map((event: {
    domain: string
    focus_seconds: number
    keystrokes: number
    recorded_at: string
  }) => ({
    rep_id: rep.id,
    domain: event.domain,
    category: categorizeDomain(event.domain),
    focus_seconds: event.focus_seconds || 0,
    keystrokes: event.keystrokes || 0,
    recorded_at: event.recorded_at,
  }))

  const { error: insertError } = await supabase
    .from('activity_events')
    .insert(activityEvents)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ 
    success: true, 
    count: activityEvents.length 
  })
}
