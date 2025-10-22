import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/resend'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { subject, bodyHtml, bodyText, sender_email } = await request.json()

  // Validate inputs
  if (!subject || !bodyHtml) {
    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
  }

  // Get contact
  const { data: contact } = await supabase
    .from('contacts')
    .select('email, name')
    .eq('id', id)
    .single()

  if (!contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  // Get sender name if sender_email is provided
  let senderName = 'CRM Outreach'
  if (sender_email) {
    const { data: sender } = await supabase
      .from('sender_emails')
      .select('name')
      .eq('email', sender_email)
      .single()
    if (sender) {
      senderName = sender.name
    }
  }

  // Process template with personalization
  const processedHtml = EmailService.processTemplate(bodyHtml, contact.name)
  const processedText = EmailService.processTemplate(bodyText || '', contact.name)
  const unsubscribeUrl = EmailService.generateUnsubscribeUrl(id)

  // Send email
  const result = await EmailService.sendEmail({
    to: contact.email,
    subject,
    html: processedHtml,
    text: processedText,
    from: sender_email,
    fromName: senderName,
    unsubscribeUrl
  })

  // Log email
  await supabase.from('email_logs').insert({
    contact_id: id,
    email_type: 'individual',
    subject,
    body_html: bodyHtml,
    body_text: bodyText,
    sender_email,
    resend_email_id: result.success ? result.emailId : null,
    status: result.success ? 'sent' : 'failed',
    sent_at: new Date().toISOString()
  })

  return NextResponse.json({ success: result.success, emailId: result.success ? result.emailId : null })
}
