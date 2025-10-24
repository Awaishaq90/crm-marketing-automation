'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, Users, BarChart3, Edit, Plus, Pause, Send } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SequenceContactsTable from './sequence-contacts-table'
import AddContactsToSequenceModal from './add-contacts-to-sequence-modal'

interface ContactInSequence {
  id: string
  contact_id: string
  name: string
  email: string
  company: string | null
  lead_status: string
  status: 'active' | 'paused' | 'completed' | 'unsubscribed'
  current_step: number
  started_at: string
  last_sent_at: string | null
  emails_sent: number
}

interface EmailTemplate {
  id: string
  order_index: number
  subject: string
  body_html: string
  body_text: string
}

interface Sequence {
  id: string
  name: string
  description: string | null
  intervals: number[]
  active: boolean
  created_at: string
}

interface User {
  email?: string
}

interface SequenceDetailClientProps {
  sequence: Sequence
  templates: EmailTemplate[]
  contacts: ContactInSequence[]
  stats: Record<string, number>
  user: User
}

export default function SequenceDetailClient({
  sequence,
  templates,
  contacts,
  stats,
  user
}: SequenceDetailClientProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleAddContacts = async (contactIds: string[], startImmediately: boolean) => {
    setIsLoading(true)
    setMessage('')
    
    try {
      const response = await fetch(`/api/sequences/${sequence.id}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactIds,
          startImmediately
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage(`Successfully added ${result.added} contacts to sequence${result.existing > 0 ? ` (${result.existing} were already in the sequence)` : ''}`)
        // Refresh the page to show updated contacts
        router.refresh()
      } else {
        setMessage(result.error || 'Failed to add contacts to sequence')
      }
    } catch (error) {
      console.error('Error adding contacts:', error)
      setMessage('An error occurred while adding contacts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (contactSequenceIds: string[], status: 'active' | 'paused') => {
    setIsLoading(true)
    setMessage('')
    
    try {
      const response = await fetch(`/api/sequences/${sequence.id}/contacts`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactSequenceIds,
          status
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage(result.message)
        // Refresh the page to show updated status
        router.refresh()
      } else {
        setMessage(result.error || 'Failed to update contact status')
      }
    } catch (error) {
      console.error('Error updating contact status:', error)
      setMessage('An error occurred while updating contact status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveContacts = async (contactSequenceIds: string[]) => {
    setIsLoading(true)
    setMessage('')
    
    try {
      const response = await fetch(`/api/sequences/${sequence.id}/contacts?ids=${contactSequenceIds.join(',')}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setMessage(result.message)
        // Refresh the page to show updated contacts
        router.refresh()
      } else {
        setMessage(result.error || 'Failed to remove contacts from sequence')
      }
    } catch (error) {
      console.error('Error removing contacts:', error)
      setMessage('An error occurred while removing contacts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessQueue = async () => {
    setIsProcessingQueue(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/email-queue/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (result.success) {
        setMessage(`Successfully processed ${result.processed} emails${result.errors?.length > 0 ? ` (${result.errors.length} errors)` : ''}`)
        // Refresh to show updated email status
        router.refresh()
      } else {
        setMessage(result.error || 'Failed to process email queue')
      }
    } catch (error) {
      console.error('Error processing email queue:', error)
      setMessage('An error occurred while processing emails')
    } finally {
      setIsProcessingQueue(false)
    }
  }

  const existingContactIds = contacts.map(c => c.contact_id)

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
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <form action="/api/auth/logout" method="post">
                <Button type="submit" variant="outline" size="sm">
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{sequence.name}</h1>
              <p className="text-gray-600">{sequence.description || 'No description'}</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/sequences">
                <Button variant="outline">Back to Sequences</Button>
              </Link>
              <Link href={`/sequences/${sequence.id}/analytics`}>
                <Button variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              <Button 
                onClick={handleProcessQueue}
                disabled={isProcessingQueue}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessingQueue ? (
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {isProcessingQueue ? 'Processing...' : 'Process Emails'}
              </Button>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              message.includes('Successfully') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Sequence Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Currently in sequence
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Finished sequence
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paused</CardTitle>
                <Pause className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.paused || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Paused contacts
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Sequence Details */}
            <Card>
              <CardHeader>
                <CardTitle>Sequence Details</CardTitle>
                <CardDescription>
                  Configuration and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">
                    <Badge className={sequence.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {sequence.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Email Intervals</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {sequence.intervals.join(', ')} days between emails
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Created</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(sequence.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Email Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  {templates.length} templates in this sequence
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templates.length > 0 ? (
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <div key={template.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">Email {template.order_index}</h4>
                            <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                Day {sequence.intervals[template.order_index - 1] || 0}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No templates found</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Management */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Contacts in Sequence</CardTitle>
                  <CardDescription>
                    Manage contacts currently in this email sequence
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} disabled={isLoading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contacts
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SequenceContactsTable
                contacts={contacts}
                onStatusChange={handleStatusChange}
                onRemove={handleRemoveContacts}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Contacts Modal */}
      <AddContactsToSequenceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddContacts}
        existingContactIds={existingContactIds}
      />
    </div>
  )
}
