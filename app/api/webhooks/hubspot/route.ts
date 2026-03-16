import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/webhooks/hubspot - Handle HubSpot webhook events
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Verify HubSpot signature (in production, you'd verify this)
  // const signature = request.headers.get('X-HubSpot-Signature')
  
  const body = await request.json()
  
  // HubSpot sends an array of events
  const events = Array.isArray(body) ? body : [body]
  
  const crmEvents = []

  for (const event of events) {
    const { subscriptionType, objectId, propertyName, propertyValue, portalId } = event
    
    // Map HubSpot email to rep (simplified - in production you'd have a mapping table)
    // For now, we'll skip rep lookup and just log the event structure
    
    let eventType = 'unknown'
    let dealValue = 0
    let dealStage = null

    // Map HubSpot subscription types to our event types
    if (subscriptionType === 'deal.creation') {
      eventType = 'deal_created'
    } else if (subscriptionType === 'deal.propertyChange' && propertyName === 'dealstage') {
      eventType = 'deal_moved'
      dealStage = propertyValue
      if (propertyValue === 'closedwon') {
        eventType = 'deal_won'
      } else if (propertyValue === 'closedlost') {
        eventType = 'deal_lost'
      }
    } else if (subscriptionType === 'contact.propertyChange' && propertyName === 'hs_sales_email_last_replied') {
      eventType = 'email_sent'
    } else if (subscriptionType?.includes('meeting')) {
      eventType = 'meeting_booked'
    }

    // In production, you'd look up the rep based on HubSpot owner or email
    // For now, we'll store the raw event for processing
    crmEvents.push({
      source: 'hubspot',
      event_type: eventType,
      deal_value: dealValue,
      deal_stage: dealStage,
      payload: event,
      occurred_at: new Date().toISOString(),
      // rep_id would be looked up from HubSpot owner
    })
  }

  // Note: In production, you'd insert these after looking up rep_ids
  // For now, we acknowledge receipt
  return NextResponse.json({ 
    success: true, 
    received: events.length,
    message: 'Webhook received. Rep mapping required for full processing.'
  })
}
