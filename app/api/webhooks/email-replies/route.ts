import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // Extract email details
    const {
      from: replyFrom,
      to: replyTo,
      subject,
      text,
      html,
      messageId
    } = body

    console.log('Received email reply:', { replyFrom, replyTo, subject })

    // Find the original email log by matching the sender email
    const { data: emailLog } = await supabase
      .from('email_logs')
      .select(`
        *,
        contacts(id, name, email),
        email_sequences(name)
      `)
      .eq('sender_email', replyTo)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single()

    if (!emailLog) {
      console.log('No matching email log found for reply')
      return NextResponse.json({ success: true, message: 'No matching email found' })
    }

    // Update the email log to mark as replied
    await supabase
      .from('email_logs')
      .update({
        status: 'replied',
        replied_at: new Date().toISOString()
      })
      .eq('id', emailLog.id)

    // Create a reply record
    await supabase
      .from('email_replies')
      .insert({
        email_log_id: emailLog.id,
        contact_id: emailLog.contact_id,
        reply_from: replyFrom,
        reply_to: replyTo,
        subject,
        body_text: text,
        body_html: html,
        message_id: messageId,
        received_at: new Date().toISOString()
      })

    // If this is a sequence email, you might want to pause the sequence
    if (emailLog.sequence_id) {
      await supabase
        .from('contact_sequences')
        .update({ status: 'paused' })
        .eq('contact_id', emailLog.contact_id)
        .eq('sequence_id', emailLog.sequence_id)
    }

    console.log('Email reply processed successfully')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error processing email reply:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
