import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectFlags, fmtTime } from '@/lib/kevi-utils'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get rep's company
    const { data: rep, error: repError } = await supabase
      .from('reps')
      .select('company_id')
      .eq('email', user.email)
      .single()

    if (repError || !rep) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 })
    }

    // Get all reps in the company
    const { data: reps } = await supabase
      .from('reps')
      .select('id, name')
      .eq('company_id', rep.company_id)

    if (!reps || !reps.length) {
      return NextResponse.json([])
    }

    const flagsData = []

    // Calculate flags for each rep
    for (const r of reps) {
      // Get this week's events (Mon-Sun)
      const today = new Date()
      const dayOfWeek = today.getDay()
      const monday = new Date(today)
      monday.setDate(monday.getDate() - (dayOfWeek || 7) + 1)
      monday.setHours(0, 0, 0, 0)

      const { data: thisWeekEvents } = await supabase
        .from('activity_events')
        .select('*')
        .eq('rep_id', r.id)
        .gte('recorded_at', monday.toISOString())
        .order('recorded_at', { ascending: true })

      // Get last week's events
      const lastMondayStart = new Date(monday)
      lastMondayStart.setDate(lastMondayStart.getDate() - 7)
      const lastMondayEnd = new Date(monday)

      const { data: lastWeekEvents } = await supabase
        .from('activity_events')
        .select('*')
        .eq('rep_id', r.id)
        .gte('recorded_at', lastMondayStart.toISOString())
        .lt('recorded_at', lastMondayEnd.toISOString())
        .order('recorded_at', { ascending: true })

      // Calculate stats
      const thisWeekStats = {
        totalSecs: thisWeekEvents?.reduce((sum, e) => sum + e.focus_seconds, 0) || 0,
        prospectingSecs: thisWeekEvents?.filter((e) => e.category === 'prospecting').reduce((sum, e) => sum + e.focus_seconds, 0) || 0,
        outreachSecs: thisWeekEvents?.filter((e) => e.category === 'outreach').reduce((sum, e) => sum + e.focus_seconds, 0) || 0,
        totalKeystrokes: thisWeekEvents?.reduce((sum, e) => sum + e.keystrokes, 0) || 0,
      }

      const lastWeekStats = {
        totalSecs: lastWeekEvents?.reduce((sum, e) => sum + e.focus_seconds, 0) || 0,
        prospectingSecs: lastWeekEvents?.filter((e) => e.category === 'prospecting').reduce((sum, e) => sum + e.focus_seconds, 0) || 0,
        outreachSecs: lastWeekEvents?.filter((e) => e.category === 'outreach').reduce((sum, e) => sum + e.focus_seconds, 0) || 0,
        totalKeystrokes: lastWeekEvents?.reduce((sum, e) => sum + e.keystrokes, 0) || 0,
      }

      // Get daily patterns for the week
      const dailyPatterns = []
      if (thisWeekEvents) {
        const eventsByDate = new Map<string, typeof thisWeekEvents>()
        for (const event of thisWeekEvents) {
          const date = event.recorded_at.split('T')[0]
          if (!eventsByDate.has(date)) {
            eventsByDate.set(date, [])
          }
          eventsByDate.get(date)!.push(event)
        }

        for (const [date, dayEvents] of eventsByDate) {
          const times = dayEvents.map((e) => parseInt(e.recorded_at.split('T')[1]))
          const firstHour = Math.min(...times.map((t) => Math.floor(t / 10000)))
          dailyPatterns.push({ date, firstActivityHour: firstHour })
        }
      }

      // Detect flags
      const flags = detectFlags(thisWeekStats, lastWeekStats, dailyPatterns)

      flagsData.push({
        repId: r.id,
        name: r.name,
        flags,
      })
    }

    // Sort by red flag count descending
    flagsData.sort((a, b) => {
      const aRed = a.flags.filter((f: any) => f.severity === 'red').length
      const bRed = b.flags.filter((f: any) => f.severity === 'red').length
      return bRed - aRed
    })

    return NextResponse.json(flagsData)
  } catch (error) {
    console.error('Coaching flags API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
