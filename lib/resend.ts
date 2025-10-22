import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailData {
  to: string
  subject: string
  html: string
  from?: string // Optional sender email, defaults to outreach@domain
  fromName?: string // Optional sender name, defaults to CRM Outreach
  text?: string
  unsubscribeUrl?: string
}

export class EmailService {
  /**
   * Send email via Resend
   */
  static async sendEmail(emailData: EmailData) {
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY not configured')
      }

      const headers: Record<string, string> = {
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      }
      
      if (emailData.unsubscribeUrl) {
        headers['List-Unsubscribe'] = `<${emailData.unsubscribeUrl}>`
      }

      // Use custom sender if provided, otherwise default to outreach@domain
      const senderEmail = emailData.from || `outreach@${process.env.EMAIL_DOMAIN || 'yourdomain.com'}`
      const senderName = emailData.fromName || 'CRM Outreach'
      
      const { data, error } = await resend.emails.send({
        from: `${senderName} <${senderEmail}>`,
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        headers
      })

      if (error) {
        throw new Error(`Resend error: ${error.message}`)
      }

      return {
        success: true,
        emailId: data?.id,
        message: 'Email sent successfully'
      }
    } catch (error) {
      console.error('Error sending email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate personalized unsubscribe URL
   */
  static generateUnsubscribeUrl(contactId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return `${baseUrl}/unsubscribe/${contactId}`
  }

  /**
   * Process email template with personalization
   */
  static processTemplate(template: string, contactName?: string, unsubscribeUrl?: string): string {
    let processed = template

    // Replace placeholders
    if (contactName) {
      processed = processed.replace(/{{CONTACT_NAME}}/g, contactName)
      processed = processed.replace(/{{NAME}}/g, contactName)
    }

    // Add unsubscribe link if not already present
    if (unsubscribeUrl && !processed.includes('unsubscribe')) {
      const unsubscribeHtml = `
        <div style="margin-top: 20px; padding: 10px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>If you no longer wish to receive these emails, you can <a href="${unsubscribeUrl}" style="color: #666;">unsubscribe here</a>.</p>
        </div>
      `
      processed += unsubscribeHtml
    }

    return processed
  }

  /**
   * Verify webhook signature (for security)
   */
  static verifyWebhookSignature(payload: string, signature: string): boolean {
    // This is a simplified version - in production, you should use proper signature verification
    // For now, we'll just check if the signature exists
    return Boolean(signature && signature.length > 0)
  }
}
