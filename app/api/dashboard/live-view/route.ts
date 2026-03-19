import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/dashboard/live-view - Get real-time status of all reps
export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company
    const { data: currentRep, error: repError } = await supabase
      .from('reps')
      .select('company_id')
      .eq('email', user.email)
      .single()

    if (repError || !currentRep) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 })
    }

    // Get all reps in company with their status
    const { data: reps, error: repsError } = await supabase
      .from('reps')
      .select(`
        id,
        name,
        email,
        extension_token,
        last_seen_at,
        created_at,
        company_id
      `)
      .eq('company_id', currentRep.company_id)
      .order('name')

    if (repsError) {
      return NextResponse.json({ error: 'Failed to fetch reps' }, { status: 500 })
    }

    // Get status for all reps
    const repIds = reps?.map(r => r.id) || []
    const { data: statuses } = await supabase
      .from('rep_status')
      .select('*')
      .in('rep_id', repIds)

    // Map statuses to reps
    const statusMap = new Map(statuses?.map(s => [s.rep_id, s]) || [])
    
    // Only override status to offline if heartbeat is very stale (> 5 min)
    // Otherwise trust the status field from rep_status table
    const now = new Date()
    const repsWithStatus = reps?.map(rep => {
      let status = statusMap.get(rep.id) || null
      
      // Only mark as offline if:
      // 1. status is explicitly 'offline' in DB, OR
      // 2. last_heartbeat_at is more than 5 minutes ago
      if (status?.last_heartbeat_at) {
        const heartbeatAge = (now.getTime() - new Date(status.last_heartbeat_at).getTime()) / 1000
        if (status.status === 'offline' || heartbeatAge > 300) {
          status = { ...status, status: 'offline' }
        }
      }
      
      return { ...rep, status }
    }) || []

    // Calculate summary
    const summary = {
      online: repsWithStatus.filter(r => r.status?.status === 'online').length,
      passive: repsWithStatus.filter(r => r.status?.status === 'passive').length,
      offline: repsWithStatus.filter(r => !r.status || r.status.status === 'offline').length,
      total_active_seconds: repsWithStatus.reduce((sum, r) => sum + (r.status?.today_active_seconds || 0), 0),
      flagged_count: repsWithStatus.filter(r => {
        if (!r.status) return false
        // Flag if automation signals detected
        return r.status.untrusted_clicks_last_min > 0 ||
               r.status.held_key_events_last_min > 3 ||
               r.status.held_mouse_events_last_min > 0
      }).length,
    }

    // ===== NEW PANELS =====

    // PANEL 1: Hourly activity for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: todayEvents } = await supabase
      .from('activity_events')
      .select('*')
      .in('rep_id', repIds)
      .gte('recorded_at', today.toISOString())
      .lt('recorded_at', tomorrow.toISOString())

    const hourlyActivity: Record<number, { totalSeconds: number; repCount: Set<string> }> = {}
    for (let h = 0; h < 24; h++) {
      hourlyActivity[h] = { totalSeconds: 0, repCount: new Set() }
    }

    todayEvents?.forEach(e => {
      const hour = new Date(e.recorded_at).getHours()
      hourlyActivity[hour].totalSeconds += e.focus_seconds || 0
      hourlyActivity[hour].repCount.add(e.rep_id)
    })

    const hourlyActivityData = Object.entries(hourlyActivity).map(([hour, data]) => ({
      hour: parseInt(hour),
      totalSeconds: data.totalSeconds,
      repCount: data.repCount.size,
    }))

    // PANEL 2: Today's leaderboard by score
    const todayLeaderboard = repsWithStatus
      .map((rep, idx) => {
        // Calculate daily score for each rep today
        const repTodayEvents = todayEvents?.filter(e => e.rep_id === rep.id) || []
        const totalActiveSecs = repTodayEvents.reduce((acc, e) => acc + (e.focus_seconds || 0), 0)
        const prospectingSecs = repTodayEvents
          .filter(e => e.category === 'linkedin' || e.category === 'email')
          .reduce((acc, e) => acc + (e.focus_seconds || 0), 0)
        const keystroke = repTodayEvents.reduce((acc, e) => acc + (e.keystrokes || 0), 0)
        
        // Simple score: active time + prospecting ratio + keystrokes
        const score = Math.min(
          100,
          Math.round((totalActiveSecs / 21600) * 35 + 
          ((prospectingSecs / (totalActiveSecs || 1)) / 0.35) * 25 +
          ((keystroke / (totalActiveSecs || 1) / 3600) / 800) * 40)
        )
        
        return {
          name: rep.name,
          score,
          activeTime: totalActiveSecs,
          topCategory: repTodayEvents.length > 0 
            ? repTodayEvents.reduce((max, e) => 
                max.count > (e.category === max.category ? max.count + 1 : 0)
                  ? max
                  : { category: e.category, count: (e.category === max.category ? max.count + 1 : 1) }
              , { category: '', count: 0 }).category
            : 'N/A',
          status: rep.status?.status || 'offline',
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((rep, idx) => ({ ...rep, rank: idx + 1 }))

    // PANEL 3: Team's most used tools today
    const domainMap: Record<string, { domain: string; category: string; totalSeconds: number; repCount: Set<string> }> = {}
    todayEvents?.forEach(e => {
      if (!domainMap[e.domain]) {
        domainMap[e.domain] = {
          domain: e.domain,
          category: e.category,
          totalSeconds: 0,
          repCount: new Set(),
        }
      }
      domainMap[e.domain].totalSeconds += e.focus_seconds || 0
      domainMap[e.domain].repCount.add(e.rep_id)
    })

    const teamTopDomains = Object.values(domainMap)
      .sort((a, b) => b.totalSeconds - a.totalSeconds)
      .slice(0, 8)
      .map(d => ({
        domain: d.domain,
        category: d.category,
        totalSeconds: d.totalSeconds,
        repCount: d.repCount.size,
      }))

    // PANEL 4: Team score trend over last 14 days
    const past14Days = new Date()
    past14Days.setDate(past14Days.getDate() - 14)
    past14Days.setHours(0, 0, 0, 0)

    const { data: past14DaysEvents } = await supabase
      .from('activity_events')
      .select('*')
      .in('rep_id', repIds)
      .gte('recorded_at', past14Days.toISOString())

    const dailyTeamScores: Record<string, { totalActive: number; totalKeystrokes: number; repCount: number }> = {}
    for (let d = 0; d < 14; d++) {
      const date = new Date(past14Days)
      date.setDate(date.getDate() + d)
      const dateStr = date.toISOString().split('T')[0]
      dailyTeamScores[dateStr] = { totalActive: 0, totalKeystrokes: 0, repCount: new Set() as any }
    }

    past14DaysEvents?.forEach(e => {
      const dateStr = new Date(e.recorded_at).toISOString().split('T')[0]
      if (dailyTeamScores[dateStr]) {
        dailyTeamScores[dateStr].totalActive += e.focus_seconds || 0
        dailyTeamScores[dateStr].totalKeystrokes += e.keystrokes || 0
        dailyTeamScores[dateStr].repCount.add(e.rep_id)
      }
    })

    const teamScoreTrend = Object.entries(dailyTeamScores)
      .map(([date, data]) => ({
        date,
        avgScore: data.repCount > 0 
          ? Math.round((data.totalActive / 21600 / data.repCount) * 35 + ((data.totalKeystrokes / data.repCount) / 800) * 40)
          : 0,
        activeRepCount: typeof data.repCount === 'number' ? data.repCount : Object.keys(data.repCount).length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      reps: repsWithStatus,
      summary,
      hourlyActivity: hourlyActivityData,
      todayLeaderboard,
      teamTopDomains,
      teamScoreTrend,
    })
  } catch (error) {
    console.error('Live view error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
