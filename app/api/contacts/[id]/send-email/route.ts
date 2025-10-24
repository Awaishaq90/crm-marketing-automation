import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/resend'
import { htmlToPlainText } from '@/lib/utils'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  console.log('=== API ROUTE CALLED ===')
  const { id } = await params
  const supabase = await createClient()
  
  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { subject, bodyHtml, sender_email } = await request.json()
  
  console.log('=== EMAIL SEND DEBUG ===')
  console.log('Request body:', { subject, bodyHtml, sender_email })

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

  // Get sender name and reply-to email if sender_email is provided
  let senderName = 'CRM Outreach'
  let replyToEmail: string | undefined
  if (sender_email) {
    console.log('Looking for sender email:', sender_email)
    const { data: sender, error: senderError } = await supabase
      .from('sender_emails')
      .select('name, reply_to_email')
      .eq('email', sender_email)
      .single()
    
    console.log('Sender query result:', { sender, senderError })
    
    if (sender) {
      senderName = sender.name
      replyToEmail = sender.reply_to_email
      console.log('Individual email - Sender data:', { name: sender.name, reply_to_email: sender.reply_to_email })
    }
  }
  
  console.log('Individual email - replyToEmail:', replyToEmail)

  // Process template with personalization
  const processedHtml = EmailService.processTemplate(bodyHtml, contact.name)
  const bodyText = htmlToPlainText(bodyHtml) // Auto-generate plain text from HTML
  const processedText = EmailService.processTemplate(bodyText, contact.name)
  const unsubscribeUrl = EmailService.generateUnsubscribeUrl(id)

  // Send email
  const emailPayloadForLog = {
    to: contact.email,
    subject,
    html: processedHtml,
    text: processedText,
    from: sender_email,
    fromName: senderName,
    replyTo: replyToEmail,
    unsubscribeUrl
  }
  
  console.log('=== ABOUT TO CALL EmailService.sendEmail ===')
  console.log('emailPayloadForLog:', JSON.stringify(emailPayloadForLog, null, 2))
  
  const result = await EmailService.sendEmail(emailPayloadForLog)
  
  console.log('=== EMAIL SEND RESULT ===')
  console.log('Result:', JSON.stringify(result, null, 2))
  console.log('Success:', result.success)
  console.log('Email ID:', result.emailId)
  console.log('=== END EMAIL SEND RESULT ===')

  // Log email
  const emailLogData = {
    contact_id: id,
    email_type: 'individual',
    subject,
    body_html: bodyHtml,
    body_text: bodyText, // Auto-generated plain text
    sender_email,
    resend_email_id: result.success ? result.emailId : null,
    status: result.success ? 'sent' : 'failed',
    sent_at: new Date().toISOString()
  }
  
  console.log('=== SAVING TO DATABASE ===')
  console.log('Email log data:', JSON.stringify(emailLogData, null, 2))
  
  const { data: savedEmail, error: saveError } = await supabase
    .from('email_logs')
    .insert(emailLogData)
    .select()
    .single()
    
  if (saveError) {
    console.error('Error saving email to database:', saveError)
  } else {
    console.log('Email saved successfully:', savedEmail)
  }

  return NextResponse.json({ 
    success: result.success, 
    emailId: result.success ? result.emailId : null,
    debug: {
      sender_email,
      senderName,
      replyToEmail,
      hasReplyTo: !!replyToEmail
    }
  })
}
