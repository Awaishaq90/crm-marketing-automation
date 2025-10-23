import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'

interface WebhookData {
  id: string
  [key: string]: unknown
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('resend-signature')
    
    // Verify webhook signature for security
    // TEMPORARILY DISABLED FOR TESTING - webhook signature verification
    // if (!EmailService.verifyWebhookSignature(body, signature || '')) {
    //   console.error('Invalid webhook signature')
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }
    
    console.log('Webhook received - signature present:', !!signature)

    const event = JSON.parse(body)
    const supabase = await createClient()

    console.log('Resend webhook event:', event.type, event.data?.id)

    switch (event.type) {
      case 'email.sent':
        await handleEmailSent(supabase, event.data)
        break
      case 'email.delivered':
        await handleEmailDelivered(supabase, event.data)
        break
      case 'email.opened':
        await handleEmailOpened(supabase, event.data)
        break
      case 'email.clicked':
        await handleEmailClicked(supabase, event.data)
        break
      case 'email.bounced':
        await handleEmailBounced(supabase, event.data)
        break
      case 'email.complained':
        await handleEmailComplained(supabase, event.data)
        break
      default:
        console.log('Unhandled webhook event type:', event.type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleEmailSent(supabase: SupabaseClient, data: WebhookData) {
  try {
    const timestamp = new Date().toISOString()
    
    // Update email log
    await supabase
      .from('email_logs')
      .update({
        status: 'sent',
        sent_at: timestamp
      })
      .eq('resend_email_id', data.id)

    // Get email log ID for event tracking
    const { data: emailLog } = await supabase
      .from('email_logs')
      .select('id')
      .eq('resend_email_id', data.id)
      .single()

    if (emailLog) {
      // Insert event record
      await supabase
        .from('email_events')
        .insert({
          email_log_id: emailLog.id,
          event_type: 'sent',
          event_data: data
        })
    }
  } catch (error) {
    console.error('Error updating email sent status:', error)
  }
}

async function handleEmailDelivered(supabase: SupabaseClient, data: WebhookData) {
  try {
    const timestamp = new Date().toISOString()
    
    // Update email log
    await supabase
      .from('email_logs')
      .update({
        status: 'delivered',
        delivered_at: timestamp
      })
      .eq('resend_email_id', data.id)

    // Get email log ID for event tracking
    const { data: emailLog } = await supabase
      .from('email_logs')
      .select('id')
      .eq('resend_email_id', data.id)
      .single()

    if (emailLog) {
      // Insert event record
      await supabase
        .from('email_events')
        .insert({
          email_log_id: emailLog.id,
          event_type: 'delivered',
          event_data: data
        })
    }
  } catch (error) {
    console.error('Error updating email delivered status:', error)
  }
}

async function handleEmailOpened(supabase: SupabaseClient, data: WebhookData) {
  try {
    const timestamp = new Date().toISOString()
    
    // Get current email log to check existing status
    const { data: emailLog } = await supabase
      .from('email_logs')
      .select('id, status, opened_at, open_count')
      .eq('resend_email_id', data.id)
      .single()

    if (!emailLog) return

    // Prepare update data
    const updateData: Record<string, unknown> = {
      open_count: (emailLog.open_count || 0) + 1,
      last_opened_at: timestamp
    }

    // Only set opened_at if this is the first open
    if (!emailLog.opened_at) {
      updateData.opened_at = timestamp
    }

    // Only update status to 'opened' if not already in a more advanced state
    const statusPriority = ['sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed']
    const currentStatusIndex = statusPriority.indexOf(emailLog.status)
    const openedStatusIndex = statusPriority.indexOf('opened')
    
    if (currentStatusIndex < openedStatusIndex) {
      updateData.status = 'opened'
    }

    // Update email log
    await supabase
      .from('email_logs')
      .update(updateData)
      .eq('resend_email_id', data.id)

    // Insert event record
    await supabase
      .from('email_events')
      .insert({
        email_log_id: emailLog.id,
        event_type: 'opened',
        event_data: data
      })
  } catch (error) {
    console.error('Error updating email opened status:', error)
  }
}

async function handleEmailClicked(supabase: SupabaseClient, data: WebhookData) {
  try {
    const timestamp = new Date().toISOString()
    
    // Get current email log to check existing status
    const { data: emailLog } = await supabase
      .from('email_logs')
      .select('id, status, opened_at, clicked_at, open_count, click_count')
      .eq('resend_email_id', data.id)
      .single()

    if (!emailLog) return

    // Prepare update data
    const updateData: Record<string, unknown> = {
      click_count: (emailLog.click_count || 0) + 1,
      last_clicked_at: timestamp
    }

    // Only set clicked_at if this is the first click
    if (!emailLog.clicked_at) {
      updateData.clicked_at = timestamp
    }

    // If email wasn't marked as opened yet, mark it as opened (click implies open)
    if (!emailLog.opened_at) {
      updateData.opened_at = timestamp
      updateData.open_count = (emailLog.open_count || 0) + 1
      updateData.last_opened_at = timestamp
    }

    // Update status to 'clicked' (highest priority except replied/bounced/failed)
    const statusPriority = ['sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed']
    const currentStatusIndex = statusPriority.indexOf(emailLog.status)
    const clickedStatusIndex = statusPriority.indexOf('clicked')
    
    if (currentStatusIndex < clickedStatusIndex) {
      updateData.status = 'clicked'
    }

    // Update email log
    await supabase
      .from('email_logs')
      .update(updateData)
      .eq('resend_email_id', data.id)

    // Insert event record
    await supabase
      .from('email_events')
      .insert({
        email_log_id: emailLog.id,
        event_type: 'clicked',
        event_data: data
      })
  } catch (error) {
    console.error('Error updating email clicked status:', error)
  }
}

async function handleEmailBounced(supabase: SupabaseClient, data: WebhookData) {
  try {
    const timestamp = new Date().toISOString()
    
    // Update email log
    await supabase
      .from('email_logs')
      .update({
        status: 'bounced',
        bounced_at: timestamp
      })
      .eq('resend_email_id', data.id)

    // Get email log ID for event tracking
    const { data: emailLog } = await supabase
      .from('email_logs')
      .select('id')
      .eq('resend_email_id', data.id)
      .single()

    if (emailLog) {
      // Insert event record
      await supabase
        .from('email_events')
        .insert({
          email_log_id: emailLog.id,
          event_type: 'bounced',
          event_data: data
        })
    }
  } catch (error) {
    console.error('Error updating email bounced status:', error)
  }
}

async function handleEmailComplained(supabase: SupabaseClient, data: WebhookData) {
  try {
    const timestamp = new Date().toISOString()
    
    // Handle spam complaint - should unsubscribe the contact
    const { data: emailLog } = await supabase
      .from('email_logs')
      .select('id, contact_id')
      .eq('resend_email_id', data.id)
      .single()

    if (emailLog) {
      // Stop all sequences for this contact
      await supabase
        .from('contact_sequences')
        .update({ status: 'unsubscribed' })
        .eq('contact_id', emailLog.contact_id)

      // Update email log
      await supabase
        .from('email_logs')
        .update({
          status: 'complained',
          complained_at: timestamp
        })
        .eq('resend_email_id', data.id)

      // Insert event record
      await supabase
        .from('email_events')
        .insert({
          email_log_id: emailLog.id,
          event_type: 'complained',
          event_data: data
        })
    }
  } catch (error) {
    console.error('Error handling email complaint:', error)
  }
}
