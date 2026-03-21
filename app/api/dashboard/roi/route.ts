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

    // Get current user's company_id via reps table
    const { data: currentRep } = await supabase
      .from('reps')
      .select('company_id')
      .eq('email', user.email)
      .single()

    if (!currentRep?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get company with goals
    const { data: company } = await supabase
      .from('companies')
      .select('id, goals')
      .eq('id', currentRep.company_id)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Default goals if not set
    const goals = company.goals || {
      activeHoursPerDay: 6,
      prospectingPct: 35,
      minFocusBlockMins: 30,
      keystrokeIntensityPerHour: 600,
      workingDaysPerMonth: 22,
    }

    // Get reps with salary
    const { data: reps } = await supabase
      .from('reps')
      .select('id, name, email, annual_salary_gbp')
      .eq('company_id', company.id)

    if (!reps?.length) {
      return NextResponse.json({ reps: [], roiData: [], goals, period })
    }

    // Get activity and deals for each rep
    const roiData = await Promise.all(
      reps.map(async (rep) => {
        const { data: events } = await supabase
          .from('activity_events')
          .select('keystroke_count, recorded_at')
          .eq('rep_id', rep.id)
          .gte('recorded_at', since)
          .lte('recorded_at', end)

        const totalActiveSecs = events?.reduce((sum, e) => {
          const keystrokes = e.keystroke_count || 0
          return sum + Math.min(keystrokes / 2, 3600) // Max 1 hour per event
        }, 0) || 0

        const costPerHour = rep.annual_salary_gbp / 1920 // 8 hours/day, 240 working days/year
        const totalCost = (totalActiveSecs / 3600) * costPerHour
        
        return {
          repId: rep.id,
          repName: rep.name,
          annualSalary: rep.annual_salary_gbp,
          activeHours: Math.round(totalActiveSecs / 3600 * 10) / 10,
          costPerActiveHour: Math.round(costPerHour),
          periodCost: Math.round(totalCost),
          roi: rep.annual_salary_gbp > 0 ? 'TBD' : 'N/A',
        }
      })
    )

    return NextResponse.json({ reps, roiData, goals, period })
  } catch (error) {
    console.error('ROI dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch ROI data' }, { status: 500 })
  }
}
