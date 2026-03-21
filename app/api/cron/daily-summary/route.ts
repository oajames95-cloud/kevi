import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // If no CRON_SECRET is set, allow in development
  if (!cronSecret) return true

  return authHeader === `Bearer ${cronSecret}`
}

interface CategoryAgg {
  [category: string]: {
    seconds: number
    keystrokes: number
  }
}

interface DomainAgg {
  [domain: string]: number
}

// GET /api/cron/daily-summary - Vercel cron job endpoint
export async function GET(request: NextRequest) {
  // Verify cron authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get yesterday's date (cron runs at 1am, so we want the previous day)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0] // YYYY-MM-DD

    const startOfDay = `${dateStr}T00:00:00Z`
    const endOfDay = `${dateStr}T23:59:59.999Z`

    // Get all reps
    const { data: reps, error: repsError } = await supabaseService
      .from('reps')
      .select('id')

    if (repsError) {
      throw new Error(`Failed to fetch reps: ${repsError.message}`)
    }

    if (!reps?.length) {
      return NextResponse.json({
        success: true,
        message: 'No reps found',
        date: dateStr,
        processed: 0,
      })
    }

    let processed = 0
    let errors: string[] = []

    for (const rep of reps) {
      try {
        // Fetch activity events for this rep on the given date
        const { data: events, error: eventsError } = await supabaseService
          .from('activity_events')
          .select('domain, category, focus_seconds, keystroke_count')
          .eq('rep_id', rep.id)
          .gte('recorded_at', startOfDay)
          .lte('recorded_at', endOfDay)

        if (eventsError) {
          errors.push(`Rep ${rep.id}: ${eventsError.message}`)
          continue
        }

        if (!events?.length) {
          // No activity for this rep, skip
          continue
        }

        // Aggregate totals
        let totalActiveSeconds = 0
        let totalKeystrokes = 0
        const byCategory: CategoryAgg = {}
        const domainSeconds: DomainAgg = {}

        for (const event of events) {
          const focusSecs = event.focus_seconds || 0
          const keystrokes = event.keystroke_count || 0
          const category = event.category || 'other'
          const domain = event.domain || 'unknown'

          totalActiveSeconds += focusSecs
          totalKeystrokes += keystrokes

          // Aggregate by category
          if (!byCategory[category]) {
            byCategory[category] = { seconds: 0, keystrokes: 0 }
          }
          byCategory[category].seconds += focusSecs
          byCategory[category].keystrokes += keystrokes

          // Aggregate by domain
          domainSeconds[domain] = (domainSeconds[domain] || 0) + focusSecs
        }

        // Get top 20 domains by focus_seconds
        const byDomain = Object.entries(domainSeconds)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .reduce((acc, [domain, seconds]) => {
            acc[domain] = seconds
            return acc
          }, {} as DomainAgg)

        // Upsert into daily_summaries
        const { error: upsertError } = await supabaseService
          .from('daily_summaries')
          .upsert(
            {
              rep_id: rep.id,
              date: dateStr,
              total_active_seconds: totalActiveSeconds,
              total_keystrokes: totalKeystrokes,
              by_category: byCategory,
              by_domain: byDomain,
            },
            { onConflict: 'rep_id,date' }
          )

        if (upsertError) {
          errors.push(`Rep ${rep.id} upsert: ${upsertError.message}`)
          continue
        }

        processed++
      } catch (repError) {
        errors.push(`Rep ${rep.id}: ${repError instanceof Error ? repError.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      date: dateStr,
      processed,
      total_reps: reps.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Daily summary cron error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
