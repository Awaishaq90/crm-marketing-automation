import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailData {
  to: string
  subject: string
  html: string
  from?: string // Optional sender email, defaults to outreach@domain
  fromName?: string // Optional sender name, defaults to CRM Outreach
  replyTo?: string // Optional reply-to email address
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
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal'
      }

      // Use custom sender if provided, otherwise default to outreach@domain
      const senderEmail = emailData.from || `outreach@${process.env.EMAIL_DOMAIN || 'yourdomain.com'}`
      const senderName = emailData.fromName || 'CRM Outreach'
      
      const emailPayload: Record<string, unknown> = {
        from: `${senderName} <${senderEmail}>`,
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        headers
      }
      
      // Add reply_to if provided (try both formats)
      if (emailData.replyTo) {
        emailPayload.reply_to = emailData.replyTo
        emailPayload.replyTo = emailData.replyTo  // Also try camelCase
      }

      // Minimal logging for debugging
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await resend.emails.send(emailPayload as any)

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
  static processTemplate(template: string, contactName?: string): string {
    let processed = template

    // Replace placeholders (case-insensitive)
    if (contactName) {
      // Handle both {{name}} and {{NAME}} variations
      processed = processed.replace(/\{\{CONTACT_NAME\}\}/gi, contactName)
      processed = processed.replace(/\{\{NAME\}\}/gi, contactName)
      // Also handle HTML-encoded curly braces from rich text editors
      processed = processed.replace(/\{\{name\}\}/gi, contactName)
      processed = processed.replace(/&#123;&#123;name&#125;&#125;/gi, contactName)
      processed = processed.replace(/&#123;&#123;NAME&#125;&#125;/gi, contactName)
    }

    // User will add unsubscribe text manually to templates when needed

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
