import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/dashboard/live-view - Get real-time status of all reps
export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company
    const { data: currentRep, error: repError } = await supabase
      .from('reps')
      .select('company_id')
      .eq('email', user.email)
      .single()

    if (repError || !currentRep) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 })
    }

    // Get all reps in company with their status
    const { data: reps, error: repsError } = await supabase
      .from('reps')
      .select(`
        id,
        name,
        email,
        extension_token,
        last_seen_at,
        created_at,
        company_id
      `)
      .eq('company_id', currentRep.company_id)
      .order('name')

    if (repsError) {
      return NextResponse.json({ error: 'Failed to fetch reps' }, { status: 500 })
    }

    // Get status for all reps
    const repIds = reps?.map(r => r.id) || []
    const { data: statuses } = await supabase
      .from('rep_status')
      .select('*')
      .in('rep_id', repIds)

    // Map statuses to reps
    const statusMap = new Map(statuses?.map(s => [s.rep_id, s]) || [])
    
    // Check for stale heartbeats (> 3 min = offline)
    const now = new Date()
    const repsWithStatus = reps?.map(rep => {
      let status = statusMap.get(rep.id) || null
      
      // Mark as offline if heartbeat is stale
      if (status?.last_heartbeat_at) {
        const heartbeatAge = (now.getTime() - new Date(status.last_heartbeat_at).getTime()) / 1000
        if (heartbeatAge > 180) {
          status = { ...status, status: 'offline' }
        }
      }
      
      return { ...rep, status }
    }) || []

    // Calculate summary
    const summary = {
      online: repsWithStatus.filter(r => r.status?.status === 'online').length,
      passive: repsWithStatus.filter(r => r.status?.status === 'passive').length,
      offline: repsWithStatus.filter(r => !r.status || r.status.status === 'offline').length,
      total_active_seconds: repsWithStatus.reduce((sum, r) => sum + (r.status?.today_active_seconds || 0), 0),
      flagged_count: repsWithStatus.filter(r => {
        if (!r.status) return false
        // Flag if automation signals detected
        return r.status.untrusted_clicks_last_min > 0 ||
               r.status.held_key_events_last_min > 3 ||
               r.status.held_mouse_events_last_min > 0
      }).length,
    }

    return NextResponse.json({ reps: repsWithStatus, summary })
  } catch (error) {
    console.error('Live view error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
