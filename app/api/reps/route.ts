import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/reps - Get all reps for the company
export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: reps, error } = await supabase
    .from('reps')
    .select('*')
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reps })
}

// POST /api/reps - Create a new rep
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, email } = body

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  // Get the user's company_id
  const { data: currentRep } = await supabase
    .from('reps')
    .select('company_id')
    .eq('email', user.email)
    .single()

  if (!currentRep) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }

  const { data: rep, error } = await supabase
    .from('reps')
    .insert({
      company_id: currentRep.company_id,
      name,
      email,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rep }, { status: 201 })
}
