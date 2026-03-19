import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPeriodDates } from '@/lib/kevi-utils'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const period = req.nextUrl.searchParams.get('period') || '30d'
    const { since } = getPeriodDates(period as '1d' | '7d' | '30d' | '180d')
    const end = new Date().toISOString()

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get company with goals
    const { data: company } = await supabase
      .from('companies')
      .select('id, goals')
      .eq('user_id', user.id)
      .single()

    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    // Default goals if not set
    const goals = company.goals || {
      activeHoursPerDay: 6,
      prospectingPct: 35,
      minFocusBlockMins: 30,
      keystrokeIntensityPerHour: 600,
      workingDaysPerMonth: 22,
    }

    // Get all reps with full metrics
    const { data: reps } = await supabase
      .from('reps')
      .select('id, name, email, annual_salary_gbp')
      .eq('company_id', company.id)
      .order('name')

    if (!reps?.length) return NextResponse.json({ benchmarks: [], goals, period })

    // Calculate metrics for each rep
    const benchmarks = await Promise.all(
      reps.map(async (rep) => {
        const { data: events } = await supabase
          .from('activity_events')
          .select('keystroke_count, focus_seconds, recorded_at')
          .eq('rep_id', rep.id)
          .gte('recorded_at', since)
          .lte('recorded_at', end)

        const eventCount = events?.length || 0
        const avgKeystrokes = eventCount > 0 ? Math.round(events!.reduce((sum, e) => sum + (e.keystroke_count || 0), 0) / eventCount) : 0
        const totalFocusSecs = events?.reduce((sum, e) => sum + (e.focus_seconds || 0), 0) || 0
        const avgFocus = eventCount > 0 ? Math.round(totalFocusSecs / eventCount) : 0

        return {
          repId: rep.id,
          repName: rep.name,
          salary: rep.annual_salary_gbp || 0,
          eventsRecorded: eventCount,
          avgKeystrokesPerEvent: avgKeystrokes,
          avgFocusSecsPerEvent: avgFocus,
          daysActive: new Set(events?.map(e => new Date(e.recorded_at).toDateString())).size,
        }
      })
    )

    // Calculate percentiles for comparison
    const sortedByKeystrokes = benchmarks.sort((a, b) => b.avgKeystrokesPerEvent - a.avgKeystrokesPerEvent)
    const sortedByFocus = benchmarks.sort((a, b) => b.avgFocusSecsPerEvent - a.avgFocusSecsPerEvent)

    return NextResponse.json({ benchmarks: benchmarks.sort((a, b) => b.avgKeystrokesPerEvent - a.avgKeystrokesPerEvent), goals, period })
  } catch (error) {
    console.error('Benchmarking error:', error)
    return NextResponse.json({ error: 'Failed to fetch benchmarking data' }, { status: 500 })
  }
}
