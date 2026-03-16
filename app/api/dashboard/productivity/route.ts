import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPeriodDates } from '@/lib/kevi-utils'

// GET /api/dashboard/productivity - Get productivity data
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '7d'
  const repId = searchParams.get('rep_id')
  const view = searchParams.get('view') || 'team' // 'team' or 'individual'

  const { start, end } = getPeriodDates(period)

  if (view === 'individual' && repId) {
    // Individual view - get detailed breakdown for one rep
    const { data: events, error } = await supabase
      .from('activity_events')
      .select('*')
      .eq('rep_id', repId)
      .gte('recorded_at', start)
      .lte('recorded_at', end)
      .order('recorded_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group events by date
    const dailyBreakdown: Record<string, {
      date: string
      total_seconds: number
      by_category: Record<string, number>
      by_domain: Record<string, number>
    }> = {}

    events?.forEach((event) => {
      const date = event.recorded_at.split('T')[0]
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = {
          date,
          total_seconds: 0,
          by_category: {},
          by_domain: {},
        }
      }
      dailyBreakdown[date].total_seconds += event.focus_seconds
      dailyBreakdown[date].by_category[event.category] = 
        (dailyBreakdown[date].by_category[event.category] || 0) + event.focus_seconds
      dailyBreakdown[date].by_domain[event.domain] = 
        (dailyBreakdown[date].by_domain[event.domain] || 0) + event.focus_seconds
    })

    // Get rep info
    const { data: rep } = await supabase
      .from('reps')
      .select('*')
      .eq('id', repId)
      .single()

    return NextResponse.json({
      rep,
      daily_breakdown: Object.values(dailyBreakdown).sort((a, b) => a.date.localeCompare(b.date)),
      period: { start, end, label: period },
    })
  }

  // Team view - get aggregated data for all reps
  const { data: reps } = await supabase
    .from('reps')
    .select('id, name')
    .order('name')

  if (!reps) {
    return NextResponse.json({ reps: [], period: { start, end, label: period } })
  }

  // Get activity events for all reps
  const { data: events, error } = await supabase
    .from('activity_events')
    .select('rep_id, category, focus_seconds, recorded_at')
    .gte('recorded_at', start)
    .lte('recorded_at', end)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Aggregate by rep
  const repStats: Record<string, {
    total_seconds: number
    by_category: Record<string, number>
  }> = {}

  events?.forEach((event) => {
    if (!repStats[event.rep_id]) {
      repStats[event.rep_id] = { total_seconds: 0, by_category: {} }
    }
    repStats[event.rep_id].total_seconds += event.focus_seconds
    repStats[event.rep_id].by_category[event.category] = 
      (repStats[event.rep_id].by_category[event.category] || 0) + event.focus_seconds
  })

  const teamData = reps.map((rep) => ({
    id: rep.id,
    name: rep.name,
    total_active_hours: (repStats[rep.id]?.total_seconds || 0) / 3600,
    by_category: repStats[rep.id]?.by_category || {},
    trend: 0, // Would need previous period data to calculate
  }))

  return NextResponse.json({
    reps: teamData.sort((a, b) => b.total_active_hours - a.total_active_hours),
    period: { start, end, label: period },
  })
}
