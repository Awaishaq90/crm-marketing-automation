'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Mail, Send } from 'lucide-react'
import Link from 'next/link'

export default function SendEmailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [contact, setContact] = useState<{id: string, name: string, email: string} | null>(null)
  const [senderEmails, setSenderEmails] = useState<{id: string, email: string, name: string, is_default: boolean}[]>([])
  const [formData, setFormData] = useState({
    subject: '',
    bodyHtml: '',
    bodyText: '',
    sender_email: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const loadContact = useCallback(async () => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', params.id)
      .single()
    setContact(data)
  }, [supabase, params.id])

  const loadSenderEmails = useCallback(async () => {
    const { data } = await supabase
      .from('sender_emails')
      .select('*')
      .eq('active', true)
      .order('is_default', { ascending: false })
      .order('name')
    setSenderEmails(data || [])
    
    // Set default sender if available
    const defaultSender = data?.find(s => s.is_default)
    if (defaultSender) {
      setFormData(prev => ({ ...prev, sender_email: defaultSender.email }))
    }
  }, [supabase])

  useEffect(() => {
    loadContact()
    loadSenderEmails()
  }, [loadContact, loadSenderEmails])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    
    try {
      console.log('Sending email with formData:', JSON.stringify(formData, null, 2))
      const response = await fetch(`/api/contacts/${params.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      
      console.log('API Response:', result)
      console.log('Debug Info:', JSON.stringify(result.debug, null, 2))
      
      if (result.success) {
        router.push(`/contacts/${params.id}`)
      } else {
        setMessage(result.error || 'Failed to send email')
      }
    } catch (error) {
      setMessage('An error occurred while sending the email')
    }
    
    setIsLoading(false)
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading contact...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href={`/contacts/${params.id}`} className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Contact
              </Link>
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Send Email</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900">
            Send email to {contact.name}
          </h2>
          <p className="text-sm text-gray-600">{contact.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Email Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="Enter email subject"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sender_email">Sender Email</Label>
                <Select
                  value={formData.sender_email}
                  onValueChange={(value) => setFormData({...formData, sender_email: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sender email" />
                  </SelectTrigger>
                  <SelectContent>
                    {senderEmails.map((sender) => (
                      <SelectItem key={sender.id} value={sender.email}>
                        {sender.name} ({sender.email})
                        {sender.is_default && ' - Default'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Choose from your configured sender emails. <Link href="/settings" className="text-blue-600 hover:underline">Manage sender emails</Link>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyHtml">HTML Body</Label>
                <textarea
                  id="bodyHtml"
                  value={formData.bodyHtml}
                  onChange={(e) => setFormData({...formData, bodyHtml: e.target.value})}
                  placeholder="Enter HTML content for the email"
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-sm text-gray-500">
                  You can use HTML tags for formatting. Use {`{{name}}`} to personalize with the contact&apos;s name.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyText">Plain Text Body (Optional)</Label>
                <textarea
                  id="bodyText"
                  value={formData.bodyText}
                  onChange={(e) => setFormData({...formData, bodyText: e.target.value})}
                  placeholder="Enter plain text version of the email"
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500">
                  Plain text version for email clients that don&apos;t support HTML
                </p>
              </div>
            </CardContent>
          </Card>

          {message && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{message}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Link href={`/contacts/${params.id}`}>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
