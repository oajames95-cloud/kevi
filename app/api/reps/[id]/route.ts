import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await req.json()
    const { annual_salary_gbp } = body

    if (typeof annual_salary_gbp !== 'number') {
      return NextResponse.json({ error: 'Invalid salary' }, { status: 400 })
    }

    // Verify the rep belongs to the admin's company
    const { data: adminRep } = await supabase
      .from('reps')
      .select('company_id')
      .eq('supabase_user_id', user.id)
      .single()

    if (!adminRep) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    const { data: targetRep } = await supabase
      .from('reps')
      .select('company_id')
      .eq('id', id)
      .single()

    if (!targetRep || targetRep.company_id !== adminRep.company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update salary
    const { data, error } = await supabase
      .from('reps')
      .update({ annual_salary_gbp })
      .eq('id', id)
      .select('id, annual_salary_gbp')
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
