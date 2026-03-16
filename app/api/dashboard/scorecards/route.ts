import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcDailyScore, calcFocusBlocks } from '@/lib/kevi-utils'

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

    const period = req.nextUrl.searchParams.get('period') || '7d'
    const days: Record<string, number> = { '1d': 1, '7d': 7, '14d': 14 }
    const periodDays = days[period] || 7

    // Get all reps in the company
    const { data: reps } = await supabase
      .from('reps')
      .select('id, name')
      .eq('company_id', rep.company_id)

    if (!reps || !reps.length) {
      return NextResponse.json([])
    }

    // Calculate scores for each rep for the past N days
    const scoreData = []

    for (const r of reps) {
      const scores = []

      // Get events for this rep for the period
      const { data: events } = await supabase
        .from('activity_events')
        .select('*')
        .eq('rep_id', r.id)
        .gte('recorded_at', new Date(Date.now() - periodDays * 86400000).toISOString())
        .order('recorded_at', { ascending: true })

      if (!events || events.length === 0) {
        scoreData.push({
          repId: r.id,
          name: r.name,
          scores: [],
        })
        continue
      }

      // Group events by date and calculate daily scores
      const eventsByDate = new Map<string, typeof events>()
      for (const event of events) {
        const date = new Date(event.recorded_at).toISOString().split('T')[0]
        if (!eventsByDate.has(date)) {
          eventsByDate.set(date, [])
        }
        eventsByDate.get(date)!.push(event)
      }

      // Calculate score for each date
      for (const [date, dayEvents] of eventsByDate) {
        const totalActiveSecs = dayEvents.reduce((sum, e) => sum + e.focus_seconds, 0)
        const totalKeystrokes = dayEvents.reduce((sum, e) => sum + e.keystrokes, 0)
        const prospectingSecs = dayEvents
          .filter((e) => e.category === 'prospecting')
          .reduce((sum, e) => sum + e.focus_seconds, 0)

        // Calculate longest block
        const blocks = calcFocusBlocks(dayEvents)
        const longestBlockMins = blocks.length > 0 ? Math.max(...blocks.map((b) => b.durationSecs / 60)) : 0
        const keystrokesPerHour = totalActiveSecs > 0 ? (totalKeystrokes / (totalActiveSecs / 3600)) : 0

        const { score, components } = calcDailyScore(totalActiveSecs, prospectingSecs, longestBlockMins, keystrokesPerHour)

        scores.push({
          date,
          score,
          components,
        })
      }

      scoreData.push({
        repId: r.id,
        name: r.name,
        scores: scores.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      })
    }

    return NextResponse.json(scoreData)
  } catch (error) {
    console.error('Scorecards API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
