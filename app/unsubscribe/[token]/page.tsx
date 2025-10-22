import { createClient } from '@/lib/supabase/server'
import { EmailQueue } from '@/lib/email-queue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface UnsubscribePageProps {
  params: {
    token: string
  }
}

export default async function UnsubscribePage({ params }: UnsubscribePageProps) {
  const supabase = await createClient()
  const emailQueue = new EmailQueue()

  let contact = null
  let error = null
  let isUnsubscribed = false

  try {
    // Find contact by ID (token is the contact ID)
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', params.token)
      .single()

    if (contactError || !contactData) {
      error = 'Invalid unsubscribe link'
    } else {
      contact = contactData

      // Check if already unsubscribed
      const { data: existingSequences } = await supabase
        .from('contact_sequences')
        .select('status')
        .eq('contact_id', params.token)
        .eq('status', 'unsubscribed')

      if (existingSequences && existingSequences.length > 0) {
        isUnsubscribed = true
      } else {
        // Unsubscribe from all sequences
        await emailQueue.stopSequenceForContact(params.token)
        isUnsubscribed = true
      }
    }
  } catch (err) {
    console.error('Error processing unsubscribe:', err)
    error = 'An error occurred while processing your request'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {error ? (
                <XCircle className="w-12 h-12 text-red-500" />
              ) : isUnsubscribed ? (
                <CheckCircle className="w-12 h-12 text-green-500" />
              ) : (
                <AlertCircle className="w-12 h-12 text-yellow-500" />
              )}
            </div>
            <CardTitle className="text-xl">
              {error ? 'Invalid Link' : isUnsubscribed ? 'Successfully Unsubscribed' : 'Processing...'}
            </CardTitle>
            <CardDescription>
              {error 
                ? 'The unsubscribe link is invalid or has expired.'
                : isUnsubscribed 
                  ? 'You have been successfully unsubscribed from all email sequences.'
                  : 'Please wait while we process your request...'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {contact && !error && (
              <div className="text-sm text-gray-600">
                <p>Email: {contact.email}</p>
                {contact.name && <p>Name: {contact.name}</p>}
              </div>
            )}
            
            {isUnsubscribed && !error && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">
                  You will no longer receive automated emails from our system. 
                  If you change your mind, you can contact us to re-subscribe.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            )}

            <div className="pt-4">
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Return to Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
