import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company_id
    const { data: rep } = await supabase
      .from('reps')
      .select('company_id')
      .eq('supabase_user_id', user.id)
      .single()

    if (!rep?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Parse request body
    const body = await req.json()
    const {
      activeHoursPerDay = 6,
      prospectingPct = 35,
      minFocusBlockMins = 30,
      keystrokeIntensityPerHour = 600,
      workingDaysPerMonth = 22,
    } = body

    const goals = {
      activeHoursPerDay,
      prospectingPct,
      minFocusBlockMins,
      keystrokeIntensityPerHour,
      workingDaysPerMonth,
    }

    // Update company goals
    const { data, error } = await supabase
      .from('companies')
      .update({ goals })
      .eq('id', rep.company_id)
      .select('id, goals')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company and goals
    const { data: rep } = await supabase
      .from('reps')
      .select('company_id')
      .eq('supabase_user_id', user.id)
      .single()

    if (!rep?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const { data: company, error } = await supabase
      .from('companies')
      .select('goals')
      .eq('id', rep.company_id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(company?.goals || {})
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
