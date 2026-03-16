import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcFocusBlocks } from '@/lib/kevi-utils'

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
    const days: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }
    const periodDays = days[period] || 7

    // Get all reps in the company
    const { data: reps } = await supabase
      .from('reps')
      .select('id, name')
      .eq('company_id', rep.company_id)

    if (!reps || !reps.length) {
      return NextResponse.json([])
    }

    // Calculate focus metrics for each rep
    const focusData = []

    for (const r of reps) {
      const { data: events } = await supabase
        .from('activity_events')
        .select('*')
        .eq('rep_id', r.id)
        .gte('recorded_at', new Date(Date.now() - periodDays * 86400000).toISOString())
        .order('recorded_at', { ascending: true })

      if (!events || events.length === 0) {
        focusData.push({
          repId: r.id,
          name: r.name,
          avgBlockMins: 0,
          longestBlockMins: 0,
          deepWorkMins: 0,
          blockDistribution: { short: 0, medium: 0, long: 0, veryLong: 0 },
          todayTimeline: [],
        })
        continue
      }

      // Calculate focus blocks
      const blocks = calcFocusBlocks(events)

      // Calculate average and longest block
      const avgBlockMins = blocks.length > 0 ? blocks.reduce((sum, b) => sum + b.durationSecs / 60, 0) / blocks.length : 0
      const longestBlockMins = blocks.length > 0 ? Math.max(...blocks.map((b) => b.durationSecs / 60)) : 0
      const deepWorkMins = blocks.filter((b) => b.durationSecs / 60 > 20).reduce((sum, b) => sum + b.durationSecs / 60, 0)

      // Distribution
      const distribution = {
        short: blocks.filter((b) => b.durationSecs / 60 < 5).length,
        medium: blocks.filter((b) => b.durationSecs / 60 >= 5 && b.durationSecs / 60 < 15).length,
        long: blocks.filter((b) => b.durationSecs / 60 >= 15 && b.durationSecs / 60 < 30).length,
        veryLong: blocks.filter((b) => b.durationSecs / 60 >= 30).length,
      }

      // Today's timeline (today's blocks)
      const today = new Date().toISOString().split('T')[0]
      const todayEvents = events.filter((e) => e.recorded_at.split('T')[0] === today)
      const todayBlocks = calcFocusBlocks(todayEvents)
      const todayTimeline = todayBlocks.map((b) => ({
        domain: b.domain,
        category: b.category,
        startTime: b.startTime,
        endTime: b.endTime,
        durationMins: Math.round(b.durationSecs / 60),
      }))

      focusData.push({
        repId: r.id,
        name: r.name,
        avgBlockMins: Math.round(avgBlockMins * 10) / 10,
        longestBlockMins: Math.round(longestBlockMins),
        deepWorkMins: Math.round(deepWorkMins),
        blockDistribution: distribution,
        todayTimeline,
      })
    }

    // Sort by avg block length descending
    focusData.sort((a, b) => b.avgBlockMins - a.avgBlockMins)

    return NextResponse.json(focusData)
  } catch (error) {
    console.error('Focus API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
