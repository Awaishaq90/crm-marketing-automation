'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEFAULT_EMAIL_INTERVALS } from '@/lib/constants'
import { Eye } from 'lucide-react'
import Link from 'next/link'
import RichTextEditor from '@/components/rich-text-editor'
import { htmlToPlainText } from '@/lib/utils'

interface EmailTemplate {
  id?: string
  order_index: number
  subject: string
  body_html: string
  body_text: string
}

export default function NewSequencePage() {
  const [sequenceData, setSequenceData] = useState({
    name: '',
    description: '',
    intervals: DEFAULT_EMAIL_INTERVALS,
    active: true,
    sender_email: ''
  })
  const [senderEmails, setSenderEmails] = useState<{id: string, email: string, name: string, is_default: boolean}[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    { order_index: 1, subject: '', body_html: '', body_text: '' },
    { order_index: 2, subject: '', body_html: '', body_text: '' },
    { order_index: 3, subject: '', body_html: '', body_text: '' },
    { order_index: 4, subject: '', body_html: '', body_text: '' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSequenceChange = (field: string, value: string | number | number[]) => {
    setSequenceData(prev => ({ ...prev, [field]: value }))
  }

  const handleTemplateChange = (index: number, field: string, value: string) => {
    setTemplates(prev => prev.map((template, i) => 
      i === index ? { ...template, [field]: value } : template
    ))
  }

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
      setSequenceData(prev => ({ ...prev, sender_email: defaultSender.email }))
    }
  }, [supabase])

  useEffect(() => {
    loadSenderEmails()
  }, [loadSenderEmails])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      // Create sequence
      const { data: sequence, error: sequenceError } = await supabase
        .from('email_sequences')
        .insert(sequenceData)
        .select()
        .single()

      if (sequenceError) {
        setMessage(sequenceError.message)
        setIsLoading(false)
        return
      }

      // Create templates with auto-generated plain text
      const templatesWithSequenceId = templates.map(template => ({
        ...template,
        sequence_id: sequence.id,
        body_text: htmlToPlainText(template.body_html) // Auto-generate plain text from HTML
      }))

      const { error: templatesError } = await supabase
        .from('email_templates')
        .insert(templatesWithSequenceId)

      if (templatesError) {
        setMessage(templatesError.message)
      } else {
        router.push('/sequences')
      }
    } catch (err) {
      console.error('Sequence creation error:', err)
      setMessage('An error occurred while creating the sequence')
    }

    setIsLoading(false)
  }


  const addUnsubscribeToTemplate = (html: string) => {
    const unsubscribeHtml = `
      <div style="margin-top: 20px; padding: 10px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
        <p>If you no longer wish to receive these emails, you can <a href="{{UNSUBSCRIBE_LINK}}" style="color: #666;">unsubscribe here</a>.</p>
      </div>
    `
    return html + unsubscribeHtml
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-semibold">
                CRM Marketing Automation
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Email Sequence</h1>
              <p className="text-gray-600">Build a 4-email automation sequence</p>
            </div>
            <Link href="/sequences">
              <Button variant="outline">Back to Sequences</Button>
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sequence Details */}
            <Card>
              <CardHeader>
                <CardTitle>Sequence Details</CardTitle>
                <CardDescription>
                  Basic information about your email sequence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Sequence Name *</Label>
                    <Input
                      id="name"
                      value={sequenceData.name}
                      onChange={(e) => handleSequenceChange('name', e.target.value)}
                      placeholder="Welcome Series"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={sequenceData.description}
                      onChange={(e) => handleSequenceChange('description', e.target.value)}
                      placeholder="Onboarding sequence for new users"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender_email">Sender Email</Label>
                  <Select
                    value={sequenceData.sender_email}
                    onValueChange={(value) => handleSequenceChange('sender_email', value)}
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
                  <Label htmlFor="intervals">Email Intervals (days)</Label>
                  <Input
                    id="intervals"
                    value={sequenceData.intervals.join(', ')}
                    onChange={(e) => handleSequenceChange('intervals', e.target.value.split(',').map(i => parseInt(i.trim())))}
                    placeholder="0, 3, 7, 14"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Comma-separated list of days between emails (e.g., 0, 3, 7, 14)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Email Templates */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Email Templates</h2>
              {templates.map((template, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Email {template.order_index}</CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`subject-${index}`}>Subject Line *</Label>
                      <Input
                        id={`subject-${index}`}
                        value={template.subject}
                        onChange={(e) => handleTemplateChange(index, 'subject', e.target.value)}
                        placeholder="Welcome to our service!"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`body-${index}`}>Email Body *</Label>
                      <RichTextEditor
                        content={template.body_html}
                        onChange={(html) => handleTemplateChange(index, 'body_html', html)}
                        placeholder="Start typing your email... Use the toolbar to format text, add links, and insert personalization variables."
                        className="min-h-[200px]"
                      />
                      <p className="text-sm text-gray-500">
                        Use the toolbar to format your email. Click &quot;Insert Name&quot; to add {`{{name}}`} personalization. Plain text will be auto-generated.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {message && (
              <div className="p-3 rounded-md bg-red-50 text-red-700">
                {message}
              </div>
            )}

            <div className="flex space-x-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Sequence'}
              </Button>
              <Link href="/sequences">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </main>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Email Preview</h3>
              <Button
                variant="outline"
                onClick={() => setPreviewTemplate(null)}
              >
                Close
              </Button>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="mb-2">
                <strong>Subject:</strong> {previewTemplate.subject}
              </div>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: addUnsubscribeToTemplate(previewTemplate.body_html) 
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
