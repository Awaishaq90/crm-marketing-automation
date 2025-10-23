'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface SenderEmail {
  id: string
  email: string
  name: string
  is_default: boolean
  active: boolean
  reply_to_email?: string
}

export default function SettingsPage() {
  const [senderEmails, setSenderEmails] = useState<SenderEmail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [editingId] = useState<string | null>(null)
  const [newSender, setNewSender] = useState({
    email: '',
    name: '',
    is_default: false,
    reply_to_email: ''
  })
  const supabase = createClient()

  useEffect(() => {
    loadSenderEmails()
  }, [loadSenderEmails])

  const loadSenderEmails = async () => {
    const { data } = await supabase
      .from('sender_emails')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name')
    console.log('Loaded sender emails:', data)
    setSenderEmails(data || [])
    setIsLoading(false)
  }

  const handleAddSender = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      console.log('Adding sender with data:', newSender)
      const { error } = await supabase
        .from('sender_emails')
        .insert([newSender])

      if (error) throw error

      setNewSender({ email: '', name: '', is_default: false, reply_to_email: '' })
      setMessage('Sender email added successfully')
      loadSenderEmails()
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateSender = async (id: string, updates: Partial<SenderEmail>) => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from('sender_emails')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      setMessage('Sender email updated successfully')
      loadSenderEmails()
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSender = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sender email?')) return
    
    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from('sender_emails')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMessage('Sender email deleted successfully')
      loadSenderEmails()
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const setAsDefault = async (id: string) => {
    // First, unset all other defaults
    await supabase
      .from('sender_emails')
      .update({ is_default: false })
      .neq('id', id)
    
    // Then set this one as default
    await handleUpdateSender(id, { is_default: true })
  }

  if (isLoading && senderEmails.length === 0) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Email Settings</h1>
          <p className="text-gray-600">Manage sender email addresses for your campaigns</p>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-md ${
            message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {message}
          </div>
        )}

        {/* Add New Sender */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Add Sender Email
            </CardTitle>
            <CardDescription>
              Add a new email address that can be used to send emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSender} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newSender.email}
                    onChange={(e) => setNewSender({...newSender, email: e.target.value})}
                    placeholder="zara@yourdomain.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name *</Label>
                  <Input
                    id="name"
                    value={newSender.name}
                    onChange={(e) => setNewSender({...newSender, name: e.target.value})}
                    placeholder="Zara Smith"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reply_to_email">Reply-To Email (Optional)</Label>
                <Input
                  id="reply_to_email"
                  type="email"
                  value={newSender.reply_to_email}
                  onChange={(e) => setNewSender({...newSender, reply_to_email: e.target.value})}
                  placeholder="your-email@gmail.com"
                />
                <p className="text-sm text-gray-500">
                  Replies will be sent to this address instead of the sender email
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_default"
                  checked={newSender.is_default}
                  onCheckedChange={(checked) => setNewSender({...newSender, is_default: !!checked})}
                />
                <Label htmlFor="is_default">Set as default sender</Label>
              </div>
              <Button type="submit" disabled={isLoading}>
                Add Sender Email
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sender Emails List */}
        <Card>
          <CardHeader>
            <CardTitle>Sender Emails</CardTitle>
            <CardDescription>
              Manage your configured sender email addresses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {senderEmails.map((sender) => (
                <div key={sender.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{sender.name}</span>
                      <span className="text-gray-500">({sender.email})</span>
                      {sender.is_default && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Default
                        </span>
                      )}
                      {!sender.active && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    {sender.reply_to_email && (
                      <div className="mt-1 text-sm text-gray-600">
                        Reply-to: {sender.reply_to_email}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {!sender.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAsDefault(sender.id)}
                        disabled={isLoading}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSender(sender.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {senderEmails.length === 0 && (
                <p className="text-gray-500 text-center py-8">No sender emails configured</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
