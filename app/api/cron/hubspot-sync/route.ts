import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase/service'

const HUBSPOT_API_BASE = 'https://api.hubapi.com/crm/v3/objects'

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // If no CRON_SECRET is set, allow in development
  if (!cronSecret) return true
  
  return authHeader === `Bearer ${cronSecret}`
}

// Fetch recent records from HubSpot API
async function fetchHubSpotRecords(
  objectType: 'deals' | 'contacts',
  accessToken: string,
  since?: string
): Promise<{ results: any[]; paging?: { next?: { after: string } } }> {
  const url = new URL(`${HUBSPOT_API_BASE}/${objectType}`)
  url.searchParams.set('limit', '10')
  url.searchParams.set('sort', '-createdate')
  
  if (objectType === 'deals') {
    url.searchParams.set('properties', 'dealname,amount,dealstage,hubspot_owner_id,createdate,closedate')
  } else {
    url.searchParams.set('properties', 'firstname,lastname,email,hubspot_owner_id,createdate')
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`HubSpot API error: ${response.status} - ${error}`)
  }

  return response.json()
}

// Process and insert deals
async function processDeals(
  records: any[],
  lastPolledAt: string
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0
  let skipped = 0

  for (const deal of records) {
    const createdAt = deal.properties.createdate
    const ownerId = deal.properties.hubspot_owner_id
    
    // Skip if older than last polled time
    if (new Date(createdAt) <= new Date(lastPolledAt)) {
      skipped++
      continue
    }

    // Check if this deal already exists (by HubSpot ID in payload)
    const { data: existing } = await supabaseService
      .from('crm_events')
      .select('id')
      .eq('source', 'hubspot')
      .contains('payload', { hubspot_id: deal.id })
      .single()

    if (existing) {
      skipped++
      continue
    }

    // Look up rep_id by matching owner_id against hubspot_owner_id in reps table
    let repId: string | null = null
    if (ownerId) {
      const { data: rep } = await supabaseService
        .from('reps')
        .select('id')
        .eq('hubspot_owner_id', ownerId)
        .single()

      repId = rep?.id || null
    }

    const { error } = await supabaseService
      .from('crm_events')
      .insert({
        source: 'hubspot',
        event_type: 'deal_created',
        deal_value: parseFloat(deal.properties.amount) || 0,
        deal_stage: deal.properties.dealstage || null,
        rep_id: repId,
        payload: {
          hubspot_id: deal.id,
          name: deal.properties.dealname,
          owner_id: ownerId,
          close_date: deal.properties.closedate,
        },
        occurred_at: createdAt,
      })

    if (!error) {
      inserted++
    }
  }

  return { inserted, skipped }
}

// Process and insert contacts
async function processContacts(
  records: any[],
  lastPolledAt: string
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0
  let skipped = 0

  for (const contact of records) {
    const createdAt = contact.properties.createdate
    const ownerId = contact.properties.hubspot_owner_id
    
    // Skip if older than last polled time
    if (new Date(createdAt) <= new Date(lastPolledAt)) {
      skipped++
      continue
    }

    // Check if this contact already exists
    const { data: existing } = await supabaseService
      .from('crm_events')
      .select('id')
      .eq('source', 'hubspot')
      .contains('payload', { hubspot_id: contact.id })
      .single()

    if (existing) {
      skipped++
      continue
    }

    // Look up rep_id by matching owner_id against hubspot_owner_id in reps table
    let repId: string | null = null
    if (ownerId) {
      const { data: rep } = await supabaseService
        .from('reps')
        .select('id')
        .eq('hubspot_owner_id', ownerId)
        .single()

      repId = rep?.id || null
    }

    const { error } = await supabaseService
      .from('crm_events')
      .insert({
        source: 'hubspot',
        event_type: 'contact_created',
        deal_value: 0,
        rep_id: repId,
        payload: {
          hubspot_id: contact.id,
          first_name: contact.properties.firstname,
          last_name: contact.properties.lastname,
          email: contact.properties.email,
          owner_id: ownerId,
        },
        occurred_at: createdAt,
      })

    if (!error) {
      inserted++
    }
  }

  return { inserted, skipped }
}

// GET /api/cron/hubspot-sync - Vercel cron job endpoint
export async function GET(request: NextRequest) {
  // Verify cron authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN
  if (!accessToken) {
    return NextResponse.json({ error: 'HUBSPOT_ACCESS_TOKEN not configured' }, { status: 500 })
  }

  try {
    const results = {
      deals: { inserted: 0, skipped: 0, error: null as string | null },
      contacts: { inserted: 0, skipped: 0, error: null as string | null },
    }

    // Get last polled timestamps
    const { data: dealsState } = await supabaseService
      .from('sync_state')
      .select('last_polled_at')
      .eq('id', 'hubspot_deals')
      .single()

    const { data: contactsState } = await supabaseService
      .from('sync_state')
      .select('last_polled_at')
      .eq('id', 'hubspot_contacts')
      .single()

    const dealsLastPolled = dealsState?.last_polled_at || '2024-01-01T00:00:00Z'
    const contactsLastPolled = contactsState?.last_polled_at || '2024-01-01T00:00:00Z'

    // Fetch and process deals
    try {
      const dealsResponse = await fetchHubSpotRecords('deals', accessToken, dealsLastPolled)
      const dealResults = await processDeals(dealsResponse.results || [], dealsLastPolled)
      results.deals = { ...dealResults, error: null }

      // Update last polled timestamp for deals
      await supabaseService
        .from('sync_state')
        .upsert({
          id: 'hubspot_deals',
          last_polled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
    } catch (error) {
      results.deals.error = error instanceof Error ? error.message : 'Unknown error'
    }

    // Fetch and process contacts
    try {
      const contactsResponse = await fetchHubSpotRecords('contacts', accessToken, contactsLastPolled)
      const contactResults = await processContacts(contactsResponse.results || [], contactsLastPolled)
      results.contacts = { ...contactResults, error: null }

      // Update last polled timestamp for contacts
      await supabaseService
        .from('sync_state')
        .upsert({
          id: 'hubspot_contacts',
          last_polled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
    } catch (error) {
      results.contacts.error = error instanceof Error ? error.message : 'Unknown error'
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error) {
    console.error('HubSpot sync error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
