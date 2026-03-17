import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { repId: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repId = params.repId
    const period = req.nextUrl.searchParams.get('period') || '7d'

    // Get the rep details
    const { data: rep } = await supabase
      .from('reps')
      .select('id, name, email, company_id, created_at, role')
      .eq('id', repId)
      .single()

    if (!rep) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 })
    }

    // Get current status
    const { data: status } = await supabase
      .from('rep_status')
      .select('*')
      .eq('rep_id', repId)
      .single()

    // Calculate period dates
    const days = { '1d': 1, '7d': 7, '30d': 30, '180d': 180 }
    const daysBack = (days as Record<string, number>)[period] || 7
    const since = new Date(Date.now() - daysBack * 86400000).toISOString()

    // Get activity events for the period
    const { data: events } = await supabase
      .from('activity_events')
      .select('*')
      .eq('rep_id', repId)
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: false })

    // Get daily summaries
    const { data: dailies } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('rep_id', repId)
      .gte('date', since.split('T')[0])
      .order('date', { ascending: false })

    // Calculate stats
    const totalActiveSecs = events?.reduce((sum, e) => sum + (e.focus_seconds || 0), 0) || 0
    const totalKeystrokes = events?.reduce((sum, e) => sum + (e.keystrokes || 0), 0) || 0
    const avgDailyActive = dailies?.length > 0 ? Math.round(dailies.reduce((sum, d) => sum + (d.total_active_seconds || 0), 0) / dailies.length) : 0

    // Get category breakdown
    const categoryMap = new Map<string, number>()
    events?.forEach(e => {
      const cat = e.category || 'unknown'
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + (e.focus_seconds || 0))
    })
    const categoryBreakdown = Array.from(categoryMap).map(([cat, secs]) => ({
      category: cat,
      seconds: secs,
    }))

    // Get deals and meetings
    const totalMeetings = dailies?.reduce((sum, d) => sum + (d.meetings_booked || 0), 0) || 0
    const totalDeals = dailies?.reduce((sum, d) => sum + (d.deals_created || 0), 0) || 0
    const totalPipeline = dailies?.reduce((sum, d) => sum + (parseFloat(d.pipeline_value as any) || 0), 0) || 0

    return NextResponse.json({
      rep,
      status,
      stats: {
        totalActiveSecs,
        totalKeystrokes,
        avgDailyActive,
        totalMeetings,
        totalDeals,
        totalPipeline,
        eventCount: events?.length || 0,
        daysWithData: dailies?.length || 0,
      },
      categoryBreakdown: categoryBreakdown.sort((a, b) => b.seconds - a.seconds),
      recentEvents: events?.slice(0, 20) || [],
      dailySummaries: dailies || [],
    })
  } catch (error) {
    console.error('Rep profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
