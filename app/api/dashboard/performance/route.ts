import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPeriodDates } from '@/lib/kevi-utils'

// GET /api/dashboard/performance - Get performance data
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '7d'
  const repId = searchParams.get('rep_id')
  const view = searchParams.get('view') || 'team'

  const { since, label } = getPeriodDates(period as '1d' | '7d' | '30d' | '180d')
  const start = since
  const end = new Date().toISOString()

  if (view === 'individual' && repId) {
    // Individual view - get CRM events and activity correlation
    const { data: crmEvents, error: crmError } = await supabase
      .from('crm_events')
      .select('*')
      .eq('rep_id', repId)
      .gte('occurred_at', start)
      .lte('occurred_at', end)
      .order('occurred_at', { ascending: true })

    if (crmError) {
      return NextResponse.json({ error: crmError.message }, { status: 500 })
    }

    // Get activity events for correlation
    const { data: activityEvents } = await supabase
      .from('activity_events')
      .select('focus_seconds, recorded_at')
      .eq('rep_id', repId)
      .gte('recorded_at', start)
      .lte('recorded_at', end)

    // Group CRM events by date
    const dailyBreakdown: Record<string, {
      date: string
      meetings_booked: number
      deals_created: number
      pipeline_value: number
    }> = {}

    crmEvents?.forEach((event) => {
      const date = event.occurred_at.split('T')[0]
      if (!dailyBreakdown[date]) {
        dailyBreakdown[date] = {
          date,
          meetings_booked: 0,
          deals_created: 0,
          pipeline_value: 0,
        }
      }
      if (event.event_type === 'meeting_booked') {
        dailyBreakdown[date].meetings_booked++
      }
      if (event.event_type === 'deal_created') {
        dailyBreakdown[date].deals_created++
        dailyBreakdown[date].pipeline_value += Number(event.deal_value) || 0
      }
    })

    // Activity vs deals correlation
    const activityByDate: Record<string, number> = {}
    activityEvents?.forEach((event) => {
      const date = event.recorded_at.split('T')[0]
      activityByDate[date] = (activityByDate[date] || 0) + event.focus_seconds
    })

    const activityVsDeals = Object.keys({ ...dailyBreakdown, ...activityByDate }).map((date) => ({
      date,
      active_hours: (activityByDate[date] || 0) / 3600,
      deals_created: dailyBreakdown[date]?.deals_created || 0,
    })).sort((a, b) => a.date.localeCompare(b.date))

    // Get rep info
    const { data: rep } = await supabase
      .from('reps')
      .select('*')
      .eq('id', repId)
      .single()

    return NextResponse.json({
      rep,
      daily_breakdown: Object.values(dailyBreakdown).sort((a, b) => a.date.localeCompare(b.date)),
      activity_vs_deals: activityVsDeals,
      period: { start, end, label: period },
    })
  }

  // Team view
  const { data: reps } = await supabase
    .from('reps')
    .select('id, name')
    .order('name')

  if (!reps) {
    return NextResponse.json({ 
      reps: [], 
      totals: { meetings_booked: 0, deals_created: 0, pipeline_value: 0 },
      period: { start, end, label: period } 
    })
  }

  // Get CRM events for all reps
  const { data: crmEvents, error } = await supabase
    .from('crm_events')
    .select('rep_id, event_type, deal_value')
    .gte('occurred_at', start)
    .lte('occurred_at', end)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Aggregate by rep
  const repStats: Record<string, {
    meetings_booked: number
    deals_created: number
    pipeline_value: number
  }> = {}

  let totalMeetings = 0
  let totalDeals = 0
  let totalPipeline = 0

  crmEvents?.forEach((event) => {
    if (!repStats[event.rep_id]) {
      repStats[event.rep_id] = { meetings_booked: 0, deals_created: 0, pipeline_value: 0 }
    }
    if (event.event_type === 'meeting_booked') {
      repStats[event.rep_id].meetings_booked++
      totalMeetings++
    }
    if (event.event_type === 'deal_created') {
      repStats[event.rep_id].deals_created++
      repStats[event.rep_id].pipeline_value += Number(event.deal_value) || 0
      totalDeals++
      totalPipeline += Number(event.deal_value) || 0
    }
  })

  const teamData = reps.map((rep) => ({
    id: rep.id,
    name: rep.name,
    meetings_booked: repStats[rep.id]?.meetings_booked || 0,
    deals_created: repStats[rep.id]?.deals_created || 0,
    pipeline_value: repStats[rep.id]?.pipeline_value || 0,
    conversion_rate: 0, // Would need more data
    trend: 0,
  }))

  return NextResponse.json({
    reps: teamData.sort((a, b) => b.pipeline_value - a.pipeline_value),
    totals: {
      meetings_booked: totalMeetings,
      deals_created: totalDeals,
      pipeline_value: totalPipeline,
    },
    period: { start, end, label: period },
  })
}
