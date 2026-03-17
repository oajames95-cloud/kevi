import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcDailyScore, calcFocusBlocks, detectFlags } from '@/lib/kevi-utils'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ repId: string }> }
) {
  try {
    const supabase = await createClient()
    const { repId } = await params
    const period = req.nextUrl.searchParams.get('period') || '7d'

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get rep details
    const { data: rep } = await supabase.from('reps').select('*').eq('id', repId).single()
    if (!rep) return NextResponse.json({ error: 'Rep not found' }, { status: 404 })

    // Get rep status
    const { data: status } = await supabase.from('rep_status').select('*').eq('rep_id', repId).single()

    // Determine date range
    const days = { '1d': 1, '7d': 7, '30d': 30, '180d': 180 }[period] || 7
    const periodStart = new Date()
    periodStart.setDate(periodStart.getDate() - days)
    periodStart.setHours(0, 0, 0, 0)

    // TODAY'S DATA (always today regardless of period)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: todayEvents } = await supabase
      .from('activity_events')
      .select('*')
      .eq('rep_id', repId)
      .gte('recorded_at', today.toISOString())
      .lt('recorded_at', tomorrow.toISOString())
      .order('recorded_at')

    // PERIOD DATA (for trends and comparisons)
    const { data: periodEvents } = await supabase
      .from('activity_events')
      .select('*')
      .eq('rep_id', repId)
      .gte('recorded_at', periodStart.toISOString())
      .lt('recorded_at', tomorrow.toISOString())
      .order('recorded_at')

    // Calculate today's stats
    const todayEventsList = todayEvents || []
    const totalActiveSecs = todayEventsList.reduce((acc, e) => acc + (e.focus_seconds || 0), 0)
    const totalKeystrokes = todayEventsList.reduce((acc, e) => acc + (e.keystrokes || 0), 0)
    const prospectingSecs = todayEventsList
      .filter(e => e.category === 'linkedin' || e.category === 'email')
      .reduce((acc, e) => acc + (e.focus_seconds || 0), 0)

    // Calculate longest focus block today
    let longestBlockMins = 0
    if (todayEventsList.length > 0) {
      const sorted = [...todayEventsList].sort(
        (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      )
      let currentBlockSecs = 0
      for (let i = 0; i < sorted.length; i++) {
        currentBlockSecs += sorted[i].focus_seconds || 0
        if (i < sorted.length - 1) {
          const gap =
            (new Date(sorted[i + 1].recorded_at).getTime() -
              new Date(sorted[i].recorded_at).getTime()) /
            1000
          if (gap > 300) {
            longestBlockMins = Math.max(longestBlockMins, Math.floor(currentBlockSecs / 60))
            currentBlockSecs = 0
          }
        }
      }
      longestBlockMins = Math.max(longestBlockMins, Math.floor(currentBlockSecs / 60))
    }

    // Today's score
    const todayScore = calcDailyScore(
      totalActiveSecs,
      prospectingSecs,
      longestBlockMins,
      totalActiveSecs > 0 ? (totalKeystrokes / (totalActiveSecs / 3600)) : 0
    ).score

    // Build today's by category
    const todayByCategory: Record<string, number> = {}
    todayEventsList.forEach(e => {
      todayByCategory[e.category] = (todayByCategory[e.category] || 0) + (e.focus_seconds || 0)
    })

    // SECTION 1: Today at a glance
    const section1 = {
      todayScore,
      scoreDelta: 0, // Will calculate from 30-day average later if needed
      activeTime: totalActiveSecs,
      status: status?.status || 'offline',
      currentDomain: status?.current_domain,
      byCategory: todayByCategory,
    }

    // SECTION 2: Focus quality - calculate focus blocks for today
    const focusBlocks = calcFocusBlocks(todayEventsList)
    const deepWorkBlocks = focusBlocks.filter(b => b.durationSecs >= 1200).length
    const deepWorkSecs = focusBlocks
      .filter(b => b.durationSecs >= 1200)
      .reduce((acc, b) => acc + b.durationSecs, 0)
    const avgFocusBlockMins = focusBlocks.length > 0 ? focusBlocks.reduce((acc, b) => acc + b.durationSecs, 0) / focusBlocks.length / 60 : 0

    const section2 = {
      focusBlocks: focusBlocks.map(b => ({
        ...b,
        label: `${b.domain} - ${Math.floor(b.durationSecs / 60)}m`,
      })),
      avgFocusBlockMins: Math.round(avgFocusBlockMins * 10) / 10,
      longestBlockMins,
      deepWorkMins: Math.floor(deepWorkSecs / 60),
    }

    // SECTION 3: Activity patterns (controlled by period)
    // Calculate daily scores and category trends for the period
    const dailyScores = []
    const categoryTrend: Record<string, number[]> = {}
    const periodEventsList = periodEvents || []

    for (let d = 0; d < days; d++) {
      const dayStart = new Date(periodStart)
      dayStart.setDate(dayStart.getDate() + d)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const dayEvents = periodEventsList.filter(
        e =>
          new Date(e.recorded_at) >= dayStart && new Date(e.recorded_at) < dayEnd
      )

      const dayActiveSecs = dayEvents.reduce((acc, e) => acc + (e.focus_seconds || 0), 0)
      const dayProspectingSecs = dayEvents
        .filter(e => e.category === 'linkedin' || e.category === 'email')
        .reduce((acc, e) => acc + (e.focus_seconds || 0), 0)
      const dayKeystrokes = dayEvents.reduce((acc, e) => acc + (e.keystrokes || 0), 0)

      const dayScore = calcDailyScore(
        dayActiveSecs,
        dayProspectingSecs,
        0,
        dayActiveSecs > 0 ? (dayKeystrokes / (dayActiveSecs / 3600)) : 0
      ).score

      dailyScores.push({
        date: dayStart.toISOString().split('T')[0],
        score: dayScore,
        activeTime: dayActiveSecs,
        prospectingPct: dayActiveSecs > 0 ? Math.round((dayProspectingSecs / dayActiveSecs) * 100) : 0,
      })

      // Build category trend
      dayEvents.forEach(e => {
        if (!categoryTrend[e.category]) categoryTrend[e.category] = []
        categoryTrend[e.category].push(e.focus_seconds || 0)
      })
    }

    const section3 = {
      personalHeatmap: [], // 84-cell grid - simplified for now
      scoreTrend: dailyScores,
      categoryTrend: Object.entries(categoryTrend).map(([cat, values]) => ({
        date: cat,
        hours: Math.floor(values.reduce((a, b) => a + b, 0) / 3600),
      })),
    }

    // SECTION 4: Vs team
    // Get team averages for the period
    const { data: allReps } = await supabase
      .from('reps')
      .select('id')
      .not('companies', 'is', null)
    const repIds = allReps?.map(r => r.id) || []

    const { data: allPeriodEvents } = await supabase
      .from('activity_events')
      .select('*')
      .in('rep_id', repIds)
      .gte('recorded_at', periodStart.toISOString())

    const teamTotalActiveSecs = allPeriodEvents?.reduce((acc, e) => acc + (e.focus_seconds || 0), 0) || 0
    const teamTotalProspectingSecs = allPeriodEvents
      ?.filter(e => e.category === 'linkedin' || e.category === 'email')
      .reduce((acc, e) => acc + (e.focus_seconds || 0), 0) || 0
    const teamAvgActiveSecs = repIds.length > 0 ? teamTotalActiveSecs / repIds.length / days : 0
    const teamAvgProspectingPct = teamTotalActiveSecs > 0 ? (teamTotalProspectingSecs / teamTotalActiveSecs) * 100 : 0

    const repActiveSecs = totalActiveSecs / Math.max(days, 1)
    const repProspectingPct = totalActiveSecs > 0 ? (prospectingSecs / totalActiveSecs) * 100 : 0

    const section4 = {
      metrics: [
        {
          label: 'Daily active time',
          repValue: Math.round(repActiveSecs / 60),
          teamValue: Math.round(teamAvgActiveSecs / 60),
          unit: 'm',
        },
        {
          label: 'Prospecting %',
          repValue: Math.round(repProspectingPct),
          teamValue: Math.round(teamAvgProspectingPct),
          unit: '%',
        },
        {
          label: 'Avg focus block',
          repValue: Math.round(avgFocusBlockMins),
          teamValue: 19, // placeholder
          unit: 'm',
        },
        {
          label: 'Keystroke intensity',
          repValue: totalActiveSecs > 0 ? Math.round(totalKeystrokes / (totalActiveSecs / 3600)) : 0,
          teamValue: 510, // placeholder
          unit: '/hr',
        },
      ],
    }

    // SECTION 5: Coaching flags
    const thisWeek = {
      totalSecs: todayEventsList.reduce((acc, e) => acc + (e.focus_seconds || 0), 0),
      prospectingSecs: todayEventsList
        .filter(e => e.category === 'linkedin' || e.category === 'email')
        .reduce((acc, e) => acc + (e.focus_seconds || 0), 0),
      outreachSecs: 0,
      totalKeystrokes: totalKeystrokes,
    }

    const lastWeekStart = new Date(periodStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)

    const { data: lastWeekEvents } = await supabase
      .from('activity_events')
      .select('*')
      .eq('rep_id', repId)
      .gte('recorded_at', lastWeekStart.toISOString())
      .lt('recorded_at', periodStart.toISOString())

    const lastWeek = {
      totalSecs: (lastWeekEvents || []).reduce((acc, e) => acc + (e.focus_seconds || 0), 0),
      prospectingSecs: (lastWeekEvents || [])
        .filter(e => e.category === 'linkedin' || e.category === 'email')
        .reduce((acc, e) => acc + (e.focus_seconds || 0), 0),
      outreachSecs: 0,
      totalKeystrokes: (lastWeekEvents || []).reduce((acc, e) => acc + (e.keystrokes || 0), 0),
    }

    const flags = detectFlags(thisWeek, lastWeek, [])

    const section5 = {
      flags,
      hasFlags: flags.length > 0,
    }

    return NextResponse.json({
      rep: {
        id: rep.id,
        name: rep.name,
        email: rep.email,
      },
      sections: {
        todayAtAGlance: section1,
        focusQuality: section2,
        activityPatterns: section3,
        vsTeam: section4,
        coachingFlags: section5,
      },
    })
  } catch (error) {
    console.error('Rep profile API error:', error)
    return NextResponse.json({ error: 'Failed to fetch rep profile' }, { status: 500 })
  }
}
