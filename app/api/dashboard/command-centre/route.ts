import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the company rep
    const { data: rep } = await supabase
      .from('reps')
      .select('id, company_id')
      .eq('supabase_user_id', user.id)
      .single()

    if (!rep) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 })
    }

    // Get all reps in the company
    const { data: reps } = await supabase
      .from('reps')
      .select('id, name, email, last_seen_at, role')
      .eq('company_id', rep.company_id)
      .order('name')

    // Get today's summaries for each rep
    const today = new Date().toISOString().split('T')[0]
    const { data: summaries } = await supabase
      .from('daily_summaries')
      .select('rep_id, total_active_seconds, total_keystrokes, meetings_booked, deals_created, pipeline_value')
      .eq('company_id', rep.company_id)
      .eq('date', today)

    // Get rep statuses
    const { data: statuses } = await supabase
      .from('rep_status')
      .select('rep_id, status, current_domain, current_category, today_active_seconds, today_keystrokes, today_meetings, last_heartbeat_at')
      .in('rep_id', reps?.map(r => r.id) || [])

    // Aggregate data
    const summaryMap = new Map(summaries?.map(s => [s.rep_id, s]) || [])
    const statusMap = new Map(statuses?.map(s => [s.rep_id, s]) || [])

    const teamData = reps?.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      status: statusMap.get(r.id)?.status || 'offline',
      currentDomain: statusMap.get(r.id)?.current_domain,
      currentCategory: statusMap.get(r.id)?.current_category,
      todayActiveSecs: statusMap.get(r.id)?.today_active_seconds || 0,
      todayKeystrokes: statusMap.get(r.id)?.today_keystrokes || 0,
      todayMeetings: statusMap.get(r.id)?.today_meetings || 0,
      dailySummary: summaryMap.get(r.id),
      isOnline: statusMap.get(r.id)?.status === 'online',
      lastSeen: r.last_seen_at || statusMap.get(r.id)?.last_heartbeat_at,
    })) || []

    // Calculate team totals
    const teamTotals = {
      totalActive: teamData.reduce((sum, r) => sum + (r.todayActiveSecs || 0), 0),
      totalMeetings: teamData.reduce((sum, r) => sum + (r.todayMeetings || 0), 0),
      totalDeals: teamData.reduce((sum, r) => sum + (r.dailySummary?.deals_created || 0), 0),
      avgKeystrokes: teamData.length > 0 ? Math.round(teamData.reduce((sum, r) => sum + (r.todayKeystrokes || 0), 0) / teamData.length) : 0,
      onlineCount: teamData.filter(r => r.isOnline).length,
      totalReps: teamData.length,
    }

    return NextResponse.json({ teamData, teamTotals })
  } catch (error) {
    console.error('Command centre error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
