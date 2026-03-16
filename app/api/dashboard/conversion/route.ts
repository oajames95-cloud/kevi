import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPeriodDates } from '@/lib/kevi-utils'

// GET /api/dashboard/conversion - Get conversion/efficiency data
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
    // Individual view - funnel and stage times
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

    // Build funnel data
    const funnelCounts: Record<string, { count: number; value: number }> = {
      'Meeting Booked': { count: 0, value: 0 },
      'Deal Created': { count: 0, value: 0 },
      'Deal Won': { count: 0, value: 0 },
    }

    crmEvents?.forEach((event) => {
      if (event.event_type === 'meeting_booked') {
        funnelCounts['Meeting Booked'].count++
      }
      if (event.event_type === 'deal_created') {
        funnelCounts['Deal Created'].count++
        funnelCounts['Deal Created'].value += Number(event.deal_value) || 0
      }
      if (event.event_type === 'deal_won') {
        funnelCounts['Deal Won'].count++
        funnelCounts['Deal Won'].value += Number(event.deal_value) || 0
      }
    })

    const funnel = Object.entries(funnelCounts).map(([stage, data]) => ({
      stage,
      count: data.count,
      value: data.value,
    }))

    // Placeholder stage times (would need deal tracking data)
    const stageTimes = [
      { stage: 'Meeting to Deal', avg_days: 3.5 },
      { stage: 'Deal to Close', avg_days: 14.2 },
    ]

    // Get rep info
    const { data: rep } = await supabase
      .from('reps')
      .select('*')
      .eq('id', repId)
      .single()

    return NextResponse.json({
      rep,
      funnel,
      stage_times: stageTimes,
      period: { start, end, label: period },
    })
  }

  // Team view - activity vs deals scatter data
  const { data: reps } = await supabase
    .from('reps')
    .select('id, name')
    .order('name')

  if (!reps) {
    return NextResponse.json({ reps: [], period: { start, end, label: period } })
  }

  // Get activity events
  const { data: activityEvents } = await supabase
    .from('activity_events')
    .select('rep_id, focus_seconds')
    .gte('recorded_at', start)
    .lte('recorded_at', end)

  // Get CRM events
  const { data: crmEvents } = await supabase
    .from('crm_events')
    .select('rep_id, event_type')
    .gte('occurred_at', start)
    .lte('occurred_at', end)

  // Aggregate
  const repActivity: Record<string, number> = {}
  const repDeals: Record<string, number> = {}

  activityEvents?.forEach((event) => {
    repActivity[event.rep_id] = (repActivity[event.rep_id] || 0) + event.focus_seconds
  })

  crmEvents?.forEach((event) => {
    if (event.event_type === 'deal_created') {
      repDeals[event.rep_id] = (repDeals[event.rep_id] || 0) + 1
    }
  })

  const teamData = reps.map((rep) => {
    const activeHours = (repActivity[rep.id] || 0) / 3600
    const dealsCreated = repDeals[rep.id] || 0
    const conversionRate = activeHours > 0 ? dealsCreated / activeHours : 0

    return {
      id: rep.id,
      name: rep.name,
      active_hours: activeHours,
      deals_created: dealsCreated,
      conversion_rate: conversionRate,
    }
  })

  return NextResponse.json({
    reps: teamData.sort((a, b) => b.conversion_rate - a.conversion_rate),
    period: { start, end, label: period },
  })
}
