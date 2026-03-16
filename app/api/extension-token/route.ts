import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  // Extension sends the Supabase access token in Authorization header
  const authHeader = req.headers.get('authorization') ?? ''
  const accessToken = authHeader.replace('Bearer ', '').trim()

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Verify the token with Supabase
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // Look up the rep by email
  const { data: rep, error: repError } = await supabaseAdmin
    .from('reps')
    .select('id, extension_token, name')
    .eq('email', user.email)
    .single()

  if (repError || !rep) {
    return NextResponse.json({ error: 'Rep not found — make sure your account is set up' }, { status: 404 })
  }

  return NextResponse.json({
    extensionToken: rep.extension_token,
    repName: rep.name,
  })
}
