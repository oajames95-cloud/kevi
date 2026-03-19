import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcDailyScore } from '@/lib/kevi-utils'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const period = req.nextUrl.searchParams.get('period') || '1d'

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get current user's company_id
    const { data: currentRep } = await supabase
      .from('reps')
      .select('company_id')
      .eq('email', user.email)
      .single()

    if (!currentRep?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get all reps (any role) for this company
    const { data: reps } = await supabase
      .from('reps')
      .select('*')
      .eq('company_id', currentRep.company_id)
      .order('name')

    if (!reps || reps.length === 0) {
      return NextResponse.json({ reps: [], teamTotals: {} })
    }

    // Get today's activity + yesterday's activity for comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // Get today's events for each rep
    const { data: todayEvents } = await supabase
      .from('activity_events')
      .select('*')
      .in(
        'rep_id',
        reps.map(r => r.id)
      )
      .gte('recorded_at', today.toISOString())
      .lt('recorded_at', new Date(today.getTime() + 86400000).toISOString())

    // Get yesterday's events for comparison
    const { data: yesterdayEvents } = await supabase
      .from('activity_events')
      .select('*')
      .in(
        'rep_id',
        reps.map(r => r.id)
      )
      .gte('recorded_at', yesterday.toISOString())
      .lt('recorded_at', today.toISOString())

    // Get rep status for online/offline indicators
    const { data: statuses } = await supabase
      .from('rep_status')
      .select('*')
      .in(
        'rep_id',
        reps.map(r => r.id)
      )

    const statusMap = new Map(statuses?.map(s => [s.rep_id, s]) || [])
    const eventsMap = new Map()
    const yesterdayEventsMap = new Map()

    todayEvents?.forEach(e => {
      if (!eventsMap.has(e.rep_id)) eventsMap.set(e.rep_id, [])
      eventsMap.get(e.rep_id).push(e)
    })

    yesterdayEvents?.forEach(e => {
      if (!yesterdayEventsMap.has(e.rep_id)) yesterdayEventsMap.set(e.rep_id, [])
      yesterdayEventsMap.get(e.rep_id).push(e)
    })

    // Calculate scorecard data for each rep
    const repCards = reps
      .map(rep => {
        const todayRepEvents = eventsMap.get(rep.id) || []
        const yesterdayRepEvents = yesterdayEventsMap.get(rep.id) || []
        const status = statusMap.get(rep.id)

        // Calculate today's stats
        const totalActiveSecs = todayRepEvents.reduce((acc, e) => acc + (e.focus_seconds || 0), 0)
        const totalKeystrokes = todayRepEvents.reduce((acc, e) => acc + (e.keystrokes || 0), 0)
        const prospectingSecs = todayRepEvents
          .filter(e => e.category === 'linkedin' || e.category === 'email')
          .reduce((acc, e) => acc + (e.focus_seconds || 0), 0)

        // Find longest focus block today (simple: longest consecutive event in same category)
        let longestBlockMins = 0
        if (todayRepEvents.length > 0) {
          const sorted = [...todayRepEvents].sort(
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

        // Calculate scores
        const todayScore = calcDailyScore(
          totalActiveSecs,
          prospectingSecs,
          longestBlockMins,
          totalActiveSecs > 0 ? (totalKeystrokes / (totalActiveSecs / 3600)) : 0
        ).score

        // Calculate yesterday's score for delta
        const yesterdayTotalSecs = yesterdayRepEvents.reduce((acc, e) => acc + (e.focus_seconds || 0), 0)
        const yesterdayProspectingSecs = yesterdayRepEvents
          .filter(e => e.category === 'linkedin' || e.category === 'email')
          .reduce((acc, e) => acc + (e.focus_seconds || 0), 0)
        const yesterdayKeystrokes = yesterdayRepEvents.reduce((acc, e) => acc + (e.keystrokes || 0), 0)

        let yesterdayLongestBlockMins = 0
        if (yesterdayRepEvents.length > 0) {
          const sorted = [...yesterdayRepEvents].sort(
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
                yesterdayLongestBlockMins = Math.max(
                  yesterdayLongestBlockMins,
                  Math.floor(currentBlockSecs / 60)
                )
                currentBlockSecs = 0
              }
            }
          }
          yesterdayLongestBlockMins = Math.max(
            yesterdayLongestBlockMins,
            Math.floor(currentBlockSecs / 60)
          )
        }

        const yesterdayScore = calcDailyScore(
          yesterdayTotalSecs,
          yesterdayProspectingSecs,
          yesterdayLongestBlockMins,
          yesterdayTotalSecs > 0 ? (yesterdayKeystrokes / (yesterdayTotalSecs / 3600)) : 0
        ).score

        const delta = todayScore - yesterdayScore

        // Build category breakdown
        const byCategory: Record<string, number> = {}
        todayRepEvents.forEach(e => {
          byCategory[e.category] = (byCategory[e.category] || 0) + (e.focus_seconds || 0)
        })

        // Get top 3-4 categories
        const topCategories = Object.entries(byCategory)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)

        return {
          id: rep.id,
          name: rep.name,
          email: rep.email,
          status: status?.status || 'offline',
          todayScore,
          deltaVsYesterday: delta,
          totalActiveSecs,
          longestBlockMinsToday: longestBlockMins,
          byCategory: topCategories.map(([cat, secs]) => ({ category: cat, seconds: secs })),
          currentDomain: status?.current_domain || null,
          lastHeartbeatAt: status?.last_heartbeat_at,
        }
      })
      .sort((a, b) => b.todayScore - a.todayScore)

    // Calculate team totals
    const teamTotalActiveSecs = todayEvents?.reduce((acc, e) => acc + (e.focus_seconds || 0), 0) || 0
    const teamTotalKeystrokes = todayEvents?.reduce((acc, e) => acc + (e.keystrokes || 0), 0) || 0
    const teamByCategory: Record<string, number> = {}
    todayEvents?.forEach(e => {
      teamByCategory[e.category] = (teamByCategory[e.category] || 0) + (e.focus_seconds || 0)
    })

    const teamTotals = {
      totalActiveSecs: teamTotalActiveSecs,
      onlineCount: repCards.filter(r => r.status === 'online').length,
      totalKeystrokes: teamTotalKeystrokes,
      byCategory: teamByCategory,
    }

    return NextResponse.json({ reps: repCards, teamTotals })
  } catch (error) {
    console.error('Team API error:', error)
    return NextResponse.json({ error: 'Failed to fetch team data' }, { status: 500 })
  }
}
