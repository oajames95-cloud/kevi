import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repId = req.nextUrl.searchParams.get('repId')
    const period = req.nextUrl.searchParams.get('period') || '30d'

    if (!repId) {
      return NextResponse.json({ error: 'Missing repId' }, { status: 400 })
    }

    const days: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }
    const periodDays = days[period] || 30
    const since = new Date(Date.now() - periodDays * 86400000).toISOString()

    // Get events for the rep
    const { data: events } = await supabase
      .from('activity_events')
      .select('recorded_at, focus_seconds')
      .eq('rep_id', repId)
      .gte('recorded_at', since)

    // Get rep name
    const { data: rep } = await supabase
      .from('reps')
      .select('name')
      .eq('id', repId)
      .single()

    // Calculate heatmap grid (7 days x 12 hours: 8am-8pm)
    const grid = Array(7)
      .fill(0)
      .map(() => Array(13).fill(0))

    if (events) {
      for (const event of events) {
        const date = new Date(event.recorded_at)
        const dayOfWeek = (date.getDay() + 6) % 7 // Convert Sun=0 to Mon=0
        const hour = date.getHours()

        if (hour >= 8 && hour < 21) {
          const hourIndex = hour - 8
          grid[dayOfWeek][hourIndex] += event.focus_seconds
        }
      }
    }

    // Convert grid to flattened array format
    const gridArray = []
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 13; hour++) {
        gridArray.push({
          day,
          hour: 8 + hour,
          seconds: grid[day][hour],
        })
      }
    }

    // Find insights
    let maxSeconds = 0
    let peakHour = 'N/A'
    let peakSeconds = 0

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 13; hour++) {
        if (grid[day][hour] > peakSeconds) {
          peakSeconds = grid[day][hour]
          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          peakHour = `${dayNames[day]} ${8 + hour}:00`
        }
      }
    }

    // Find quietest period
    let minSeconds = Infinity
    let quietestPeriod = 'N/A'

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 13; hour++) {
        if (grid[day][hour] < minSeconds && grid[day][hour] > 0) {
          minSeconds = grid[day][hour]
          const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          quietestPeriod = `${dayNames[day]} ${8 + hour}:00`
        }
      }
    }

    // Find most consistent day
    let bestConsistency = Infinity
    let mostConsistent = 'N/A'

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    for (let day = 0; day < 7; day++) {
      const dayHours = grid[day].filter((s) => s > 0)
      if (dayHours.length > 0) {
        const mean = dayHours.reduce((a, b) => a + b) / dayHours.length
        const variance = dayHours.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dayHours.length
        if (variance < bestConsistency) {
          bestConsistency = variance
          mostConsistent = dayNames[day]
        }
      }
    }

    return NextResponse.json({
      repId,
      name: rep?.name || 'Rep',
      grid: gridArray,
      insights: {
        peakHour,
        quietestPeriod,
        mostConsistent,
      },
    })
  } catch (error) {
    console.error('Heatmap API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
