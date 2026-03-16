import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company_name, company_slug, admin_name, admin_email, supabase_user_id } = body

    if (!company_name || !company_slug || !admin_name || !admin_email || !supabase_user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== supabase_user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has a company
    const { data: existingRep } = await supabase
      .from('reps')
      .select('id')
      .eq('supabase_user_id', supabase_user_id)
      .single()

    if (existingRep) {
      return NextResponse.json({ error: 'You already belong to a company' }, { status: 400 })
    }

    // Check if slug is taken
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', company_slug)
      .single()

    if (existingCompany) {
      return NextResponse.json({ error: 'Company slug is already taken' }, { status: 400 })
    }

    // Create company (using service role for initial creation)
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: company_name,
        slug: company_slug,
      })
      .select()
      .single()

    if (companyError) {
      console.error('Company creation error:', companyError)
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
    }

    // Create admin rep
    const { data: rep, error: repError } = await supabase
      .from('reps')
      .insert({
        company_id: company.id,
        name: admin_name,
        email: admin_email,
        role: 'admin',
        supabase_user_id: supabase_user_id,
      })
      .select()
      .single()

    if (repError) {
      console.error('Rep creation error:', repError)
      // Rollback company creation
      await supabase.from('companies').delete().eq('id', company.id)
      return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      company_id: company.id,
      rep_id: rep.id,
      extension_token: rep.extension_token,
    })
  } catch (error) {
    console.error('Onboarding setup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
