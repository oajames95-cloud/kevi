import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repA = req.nextUrl.searchParams.get('repA')
    const repB = req.nextUrl.searchParams.get('repB')
    const period = req.nextUrl.searchParams.get('period') || '7d'

    if (!repA || !repB) {
      return NextResponse.json({ error: 'Missing repA or repB' }, { status: 400 })
    }

    const days: Record<string, number> = { '7d': 7, '30d': 30 }
    const periodDays = days[period] || 7
    const since = new Date(Date.now() - periodDays * 86400000).toISOString()

    // Get events for both reps
    const { data: eventsA } = await supabase
      .from('activity_events')
      .select('*')
      .eq('rep_id', repA)
      .gte('recorded_at', since)

    const { data: eventsB } = await supabase
      .from('activity_events')
      .select('*')
      .eq('rep_id', repB)
      .gte('recorded_at', since)

    // Get rep names
    const { data: reps } = await supabase
      .from('reps')
      .select('id, name')
      .in('id', [repA, repB])

    const repAData = reps?.find((r) => r.id === repA)
    const repBData = reps?.find((r) => r.id === repB)

    // Calculate stats
    const calcStats = (events: any[]) => {
      const totalSecs = events?.reduce((sum, e) => sum + e.focus_seconds, 0) || 0
      const prospectingSecs = events?.filter((e) => e.category === 'prospecting').reduce((sum, e) => sum + e.focus_seconds, 0) || 0
      const outreachSecs = events?.filter((e) => e.category === 'outreach').reduce((sum, e) => sum + e.focus_seconds, 0) || 0
      const crmSecs = events?.filter((e) => e.category === 'crm').reduce((sum, e) => sum + e.focus_seconds, 0) || 0
      const totalKeystrokes = events?.reduce((sum, e) => sum + e.keystrokes, 0) || 0
      const keystrokesPerHour = totalSecs > 0 ? (totalKeystrokes / (totalSecs / 3600)) : 0

      return {
        total_active_hours: Math.round(totalSecs / 3600 * 10) / 10,
        prospecting_hours: Math.round(prospectingSecs / 3600 * 10) / 10,
        outreach_hours: Math.round(outreachSecs / 3600 * 10) / 10,
        crm_hours: Math.round(crmSecs / 3600 * 10) / 10,
        keystroke_intensity: Math.round(keystrokesPerHour),
      }
    }

    const statsA = calcStats(eventsA)
    const statsB = calcStats(eventsB)

    // Calculate differences
    const calcDiff = (a: number, b: number) => {
      if (b === 0) return { pct: a === 0 ? 0 : 100, winner: a > b ? 'A' : 'B' }
      const pct = Math.round(((a - b) / b) * 100)
      return { pct, winner: a > b ? 'A' : a < b ? 'B' : 'equal' }
    }

    const differences = {
      total_active_hours: calcDiff(statsA.total_active_hours, statsB.total_active_hours),
      prospecting_hours: calcDiff(statsA.prospecting_hours, statsB.prospecting_hours),
      outreach_hours: calcDiff(statsA.outreach_hours, statsB.outreach_hours),
      crm_hours: calcDiff(statsA.crm_hours, statsB.crm_hours),
      keystroke_intensity: calcDiff(statsA.keystroke_intensity, statsB.keystroke_intensity),
    }

    // Calculate daily scores for trend
    const eventsByDateA = new Map<string, typeof eventsA>()
    const eventsByDateB = new Map<string, typeof eventsB>()

    for (const event of eventsA || []) {
      const date = event.recorded_at.split('T')[0]
      if (!eventsByDateA.has(date)) eventsByDateA.set(date, [])
      eventsByDateA.get(date)!.push(event)
    }

    for (const event of eventsB || []) {
      const date = event.recorded_at.split('T')[0]
      if (!eventsByDateB.has(date)) eventsByDateB.set(date, [])
      eventsByDateB.get(date)!.push(event)
    }

    const dailyScores = []
    const allDates = new Set([...eventsByDateA.keys(), ...eventsByDateB.keys()])
    for (const date of Array.from(allDates).sort()) {
      const daysEventsA = eventsByDateA.get(date) || []
      const daysEventsB = eventsByDateB.get(date) || []
      const scoreA = Math.round(daysEventsA.reduce((sum, e) => sum + e.focus_seconds, 0) / 3600)
      const scoreB = Math.round(daysEventsB.reduce((sum, e) => sum + e.focus_seconds, 0) / 3600)
      dailyScores.push({ date, scoreA, scoreB })
    }

    return NextResponse.json({
      repA: { id: repA, name: repAData?.name || 'Rep A', stats: statsA },
      repB: { id: repB, name: repBData?.name || 'Rep B', stats: statsB },
      differences,
      dailyScores,
    })
  } catch (error) {
    console.error('Comparison API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
