import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EmailService } from '@/lib/resend'
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
    if (!EmailService.verifyWebhookSignature(body, signature || '')) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

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
    await supabase
      .from('email_logs')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('resend_email_id', data.id)
  } catch (error) {
    console.error('Error updating email sent status:', error)
  }
}

async function handleEmailDelivered(supabase: SupabaseClient, data: WebhookData) {
  try {
    await supabase
      .from('email_logs')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('resend_email_id', data.id)
  } catch (error) {
    console.error('Error updating email delivered status:', error)
  }
}

async function handleEmailOpened(supabase: SupabaseClient, data: WebhookData) {
  try {
    await supabase
      .from('email_logs')
      .update({
        status: 'opened',
        opened_at: new Date().toISOString()
      })
      .eq('resend_email_id', data.id)
  } catch (error) {
    console.error('Error updating email opened status:', error)
  }
}

async function handleEmailClicked(supabase: SupabaseClient, data: WebhookData) {
  try {
    await supabase
      .from('email_logs')
      .update({
        status: 'clicked',
        clicked_at: new Date().toISOString()
      })
      .eq('resend_email_id', data.id)
  } catch (error) {
    console.error('Error updating email clicked status:', error)
  }
}

async function handleEmailBounced(supabase: SupabaseClient, data: WebhookData) {
  try {
    await supabase
      .from('email_logs')
      .update({
        status: 'bounced',
        bounced_at: new Date().toISOString()
      })
      .eq('resend_email_id', data.id)
  } catch (error) {
    console.error('Error updating email bounced status:', error)
  }
}

async function handleEmailComplained(supabase: SupabaseClient, data: WebhookData) {
  try {
    // Handle spam complaint - should unsubscribe the contact
    const { data: emailLog } = await supabase
      .from('email_logs')
      .select('contact_id')
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
          complained_at: new Date().toISOString()
        })
        .eq('resend_email_id', data.id)
    }
  } catch (error) {
    console.error('Error handling email complaint:', error)
  }
}
