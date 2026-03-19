// hubspot sync v2
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow direct access for manual testing
  }

  const token = process.env.HUBSPOT_ACCESS_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Missing HUBSPOT_ACCESS_TOKEN' }, { status: 500 })
  }

  try {
    // Fetch recent deals
    const dealsRes = await fetch(
      'https://api.hubapi.com/crm/v3/objects/deals?limit=10&sort=-createdate&properties=dealname,dealstage,amount,closedate',
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const dealsData = await dealsRes.json()
    const deals = dealsData.results ?? []

    // Fetch recent contacts
    const contactsRes = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts?limit=10&sort=-createdate&properties=firstname,lastname,email',
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const contactsData = await contactsRes.json()
    const contacts = contactsData.results ?? []

    // Get last sync time
    const { data: syncState } = await supabase
      .from('sync_state')
      .select('last_synced_at')
      .eq('key', 'hubspot')
      .single()

    const lastSynced = syncState?.last_synced_at
      ? new Date(syncState.last_synced_at)
      : new Date(0)

    // Insert new deals
    for (const deal of deals) {
      const createdAt = new Date(deal.createdAt)
      if (createdAt <= lastSynced) continue

      await supabase.from('crm_events').insert({
        source: 'hubspot',
        event_type: 'deal.creation',
        deal_value: deal.properties?.amount ? parseFloat(deal.properties.amount) : 0,
        deal_stage: deal.properties?.dealstage ?? null,
        metadata: deal.properties,
      })
    }

    // Insert new contacts
    for (const contact of contacts) {
      const createdAt = new Date(contact.createdAt)
      if (createdAt <= lastSynced) continue

      await supabase.from('crm_events').insert({
        source: 'hubspot',
        event_type: 'contact.creation',
        metadata: contact.properties,
      })
    }

    // Update sync state
    await supabase.from('sync_state').upsert({
      key: 'hubspot',
      last_synced_at: new Date().toISOString(),
    })

    return NextResponse.json({
      ok: true,
      deals: deals.length,
      contacts: contacts.length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
