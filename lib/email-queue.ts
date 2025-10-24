import { createClient } from '@/lib/supabase/server'
import { EMAIL_QUEUE_PRIORITIES, EMAIL_BATCH_SIZE } from '@/lib/constants'

interface QueueItem {
  id: string
  contact_id: string
  sequence_id: string
  template_id: string
  scheduled_at: string
  priority: number
  status: string
  retry_count: number
  sender_email?: string
  sender_name?: string
  email_templates?: {
    body_html: string
    body_text: string
    subject: string
  }
  contacts?: {
    name: string
    email: string
  }
}

export class EmailQueue {
  private supabase: Awaited<ReturnType<typeof createClient>>

  constructor() {
    this.supabase = null as unknown as Awaited<ReturnType<typeof createClient>> // Will be initialized in methods
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Add contacts to email queue for a sequence
   */
  async addContactsToQueue(contactIds: string[], sequenceId: string) {
    try {
      const supabase = await this.getSupabase()
      // Get sequence details
      const { data: sequence, error: sequenceError } = await supabase
        .from('email_sequences')
        .select('intervals, sender_email')
        .eq('id', sequenceId)
        .single()

      if (sequenceError || !sequence) {
        throw new Error('Sequence not found')
      }

      // Get templates for this sequence
      const { data: templates, error: templatesError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('sequence_id', sequenceId)
        .order('order_index', { ascending: true })

      if (templatesError || !templates || templates.length === 0) {
        throw new Error('No templates found for sequence')
      }

      // Create contact sequences
      const contactSequences = contactIds.map(contactId => ({
        contact_id: contactId,
        sequence_id: sequenceId,
        status: 'active' as const,
        current_step: 1,
        started_at: new Date().toISOString()
      }))

      const { error: contactSequencesError } = await supabase
        .from('contact_sequences')
        .insert(contactSequences)

      if (contactSequencesError) {
        throw new Error(`Failed to create contact sequences: ${contactSequencesError.message}`)
      }

      // Add first emails to queue (immediate)
      const queueItems = contactIds.map(contactId => ({
        contact_id: contactId,
        sequence_id: sequenceId,
        template_id: templates[0].id,
        scheduled_at: new Date().toISOString(),
        priority: EMAIL_QUEUE_PRIORITIES.HIGH,
        status: 'pending' as const,
        sender_email: sequence.sender_email
      }))

      const { error: queueError } = await supabase
        .from('email_queue')
        .insert(queueItems)

      if (queueError) {
        throw new Error(`Failed to add to queue: ${queueError.message}`)
      }

      return { success: true, count: contactIds.length }
    } catch (error) {
      console.error('Error adding contacts to queue:', error)
      throw error
    }
  }

  /**
   * Process pending emails from queue (batch processing)
   */
  async processQueue() {
    try {
      const supabase = await this.getSupabase()
      // Get pending emails (max batch size)
      const { data: queueItems, error: queueError } = await supabase
        .from('email_queue')
        .select(`
          *,
          contacts(email, name),
          email_templates(subject, body_html, body_text),
          email_sequences(name)
        `)
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('priority', { ascending: true })
        .order('scheduled_at', { ascending: true })
        .limit(EMAIL_BATCH_SIZE)

      if (queueError) {
        throw new Error(`Failed to fetch queue items: ${queueError.message}`)
      }

      if (!queueItems || queueItems.length === 0) {
        return { processed: 0, message: 'No pending emails' }
      }

      let processed = 0
      const errors: string[] = []

      for (const item of queueItems) {
        try {
          // Send email (this would integrate with Resend)
          const emailResult = await this.sendEmail(item)
          
          if (emailResult.success) {
            // Update queue item
            await supabase
              .from('email_queue')
              .update({ 
                status: 'sent',
                updated_at: new Date().toISOString()
              })
              .eq('id', item.id)

            // Create email log
            await supabase
              .from('email_logs')
              .insert({
                contact_id: item.contact_id,
                sequence_id: item.sequence_id,
                template_id: item.template_id,
                resend_email_id: emailResult.emailId,
                status: 'sent',
                sent_at: new Date().toISOString()
              })

            // Update contact sequence
            await supabase
              .from('contact_sequences')
              .update({ 
                last_sent_at: new Date().toISOString()
              })
              .eq('contact_id', item.contact_id)
              .eq('sequence_id', item.sequence_id)

            // Schedule next email if not the last one
            await this.scheduleNextEmail(item)

            processed++
          } else {
            // Mark as failed and increment retry count
            await supabase
              .from('email_queue')
              .update({ 
                status: 'failed',
                retry_count: item.retry_count + 1
              })
              .eq('id', item.id)

            errors.push(`Failed to send email to ${item.contacts?.email}: ${emailResult.error}`)
          }
        } catch (error) {
          console.error(`Error processing queue item ${item.id}:`, error)
          errors.push(`Error processing ${item.contacts?.email}: ${error}`)
        }
      }

      return { 
        processed, 
        errors,
        message: `Processed ${processed} emails${errors.length > 0 ? `, ${errors.length} errors` : ''}`
      }
    } catch (error) {
      console.error('Error processing queue:', error)
      throw error
    }
  }

  /**
   * Send email via Resend
   */
  private async sendEmail(queueItem: QueueItem) {
    try {
      const { EmailService } = await import('@/lib/resend')
      const supabase = await this.getSupabase()
      
      // Fetch sender name and reply-to email if sender_email is provided
      let senderName = 'CRM Outreach'
      let replyToEmail: string | undefined
      if (queueItem.sender_email) {
        const { data: sender } = await supabase
          .from('sender_emails')
          .select('name, reply_to_email')
          .eq('email', queueItem.sender_email)
          .single()
        if (sender) {
          senderName = sender.name
          replyToEmail = sender.reply_to_email
          console.log('Sender data:', { name: sender.name, reply_to_email: sender.reply_to_email })
        }
      }
      
      console.log('Email queue - replyToEmail:', replyToEmail)
      
      // Generate unsubscribe URL
      const unsubscribeUrl = EmailService.generateUnsubscribeUrl(queueItem.contact_id)
      
      // Process template with personalization
      const processedHtml = EmailService.processTemplate(
        queueItem.email_templates?.body_html || '',
        queueItem.contacts?.name,
        unsubscribeUrl
      )

      const processedText = EmailService.processTemplate(
        queueItem.email_templates?.body_text || '',
        queueItem.contacts?.name
      )

      // Send email via Resend
      if (!queueItem.contacts?.email) {
        throw new Error('Contact email not found')
      }
      
      const result = await EmailService.sendEmail({
        to: queueItem.contacts.email,
        subject: queueItem.email_templates?.subject || 'No Subject',
        html: processedHtml,
        text: processedText,
        from: queueItem.sender_email,
        fromName: senderName,
        replyTo: replyToEmail,
        unsubscribeUrl
      })

      return result
    } catch (error) {
      console.error('Error sending email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Schedule next email in sequence
   */
  private async scheduleNextEmail(currentItem: QueueItem) {
    try {
      const supabase = await this.getSupabase()
      // Get current contact sequence
      const { data: contactSequence, error: contactSequenceError } = await supabase
        .from('contact_sequences')
        .select('*')
        .eq('contact_id', currentItem.contact_id)
        .eq('sequence_id', currentItem.sequence_id)
        .single()

      if (contactSequenceError || !contactSequence) {
        return
      }

      // Check if this is the last email
      const { data: templates, error: templatesError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('sequence_id', currentItem.sequence_id)
        .order('order_index', { ascending: true })

      if (templatesError || !templates || contactSequence.current_step >= templates.length) {
        // Mark sequence as completed
        await supabase
          .from('contact_sequences')
          .update({ status: 'completed' })
          .eq('id', contactSequence.id)
        return
      }

      // Get sequence intervals and sender email
      const { data: sequence, error: sequenceError } = await supabase
        .from('email_sequences')
        .select('intervals, sender_email')
        .eq('id', currentItem.sequence_id)
        .single()

      if (sequenceError || !sequence) {
        return
      }

      const nextStep = contactSequence.current_step + 1
      const nextTemplate = templates.find(t => t.order_index === nextStep)
      
      if (!nextTemplate) {
        return
      }

      // Calculate next send time
      const intervalDays = sequence.intervals[nextStep - 1] || 0
      const nextSendTime = new Date()
      nextSendTime.setDate(nextSendTime.getDate() + intervalDays)

      // Add next email to queue
      await supabase
        .from('email_queue')
        .insert({
          contact_id: currentItem.contact_id,
          sequence_id: currentItem.sequence_id,
          template_id: nextTemplate.id,
          scheduled_at: nextSendTime.toISOString(),
          priority: EMAIL_QUEUE_PRIORITIES.NORMAL,
          status: 'pending',
          sender_email: sequence.sender_email
        })

      // Update contact sequence current step
      await supabase
        .from('contact_sequences')
        .update({ current_step: nextStep })
        .eq('id', contactSequence.id)

    } catch (error) {
      console.error('Error scheduling next email:', error)
    }
  }

  /**
   * Stop sequence for a contact (unsubscribe)
   */
  async stopSequenceForContact(contactId: string, sequenceId?: string) {
    try {
      const supabase = await this.getSupabase()
      const query = supabase
        .from('contact_sequences')
        .update({ status: 'unsubscribed' })
        .eq('contact_id', contactId)

      if (sequenceId) {
        query.eq('sequence_id', sequenceId)
      }

      const { error } = await query

      if (error) {
        throw new Error(`Failed to stop sequence: ${error.message}`)
      }

      // Remove pending emails from queue
      const queueQuery = supabase
        .from('email_queue')
        .delete()
        .eq('contact_id', contactId)
        .eq('status', 'pending')

      if (sequenceId) {
        queueQuery.eq('sequence_id', sequenceId)
      }

      await queueQuery

      return { success: true }
    } catch (error) {
      console.error('Error stopping sequence:', error)
      throw error
    }
  }
}
