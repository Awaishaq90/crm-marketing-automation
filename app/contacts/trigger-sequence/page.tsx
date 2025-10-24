'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play } from 'lucide-react'
import Link from 'next/link'

interface Contact {
  id: string
  email: string
  name: string | null
  company: string | null
  lead_status: string
}

interface Sequence {
  id: string
  name: string
  description: string | null
  active: boolean
}

export default function TriggerSequencePage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [selectedSequence, setSelectedSequence] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [contactsInSequence, setContactsInSequence] = useState<string[]>([])
  const supabase = createClient()

  const loadData = useCallback(async () => {
    try {
      // Load contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order('name', { ascending: true })

      if (contactsError) {
        console.error('Error loading contacts:', contactsError)
      } else {
        setContacts(contactsData || [])
      }

      // Load sequences
      const { data: sequencesData, error: sequencesError } = await supabase
        .from('email_sequences')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true })

      if (sequencesError) {
        console.error('Error loading sequences:', sequencesError)
      } else {
        setSequences(sequencesData || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoadingData(false)
    }
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Load contacts already in the selected sequence
  const loadContactsInSequence = useCallback(async (sequenceId: string) => {
    if (!sequenceId) {
      setContactsInSequence([])
      return
    }

    try {
      const { data: contactSequences, error } = await supabase
        .from('contact_sequences')
        .select('contact_id')
        .eq('sequence_id', sequenceId)
        .in('status', ['active', 'paused'])

      if (error) {
        console.error('Error loading contacts in sequence:', error)
        setContactsInSequence([])
      } else {
        const contactIds = contactSequences?.map(cs => cs.contact_id) || []
        setContactsInSequence(contactIds)
      }
    } catch (error) {
      console.error('Error loading contacts in sequence:', error)
      setContactsInSequence([])
    }
  }, [supabase])

  // Handle sequence selection change
  const handleSequenceChange = (sequenceId: string) => {
    setSelectedSequence(sequenceId)
    setSelectedContacts([]) // Clear selected contacts when sequence changes
    loadContactsInSequence(sequenceId)
  }

  const handleContactToggle = (contactId: string) => {
    // Don't allow toggling contacts that are already in the sequence
    if (contactsInSequence.includes(contactId)) {
      return
    }
    
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const handleSelectAll = () => {
    // Filter out contacts that are already in the sequence
    const availableContacts = contacts.filter(c => !contactsInSequence.includes(c.id))
    
    if (selectedContacts.length === availableContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(availableContacts.map(c => c.id))
    }
  }

  const handleTriggerSequence = async () => {
    if (!selectedSequence || selectedContacts.length === 0) {
      setMessage('Please select a sequence and at least one contact')
      return
    }

    // Filter out contacts that are already in the sequence
    const availableContacts = selectedContacts.filter(id => !contactsInSequence.includes(id))
    
    if (availableContacts.length === 0) {
      setMessage('All selected contacts are already in this sequence')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch(`/api/sequences/${selectedSequence}/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactIds: availableContacts
        })
      })

      const result = await response.json()

      if (result.success) {
        const filteredOut = selectedContacts.length - availableContacts.length
        let message = `Successfully added ${result.added} contacts to sequence`
        if (result.existing > 0) {
          message += ` (${result.existing} were already in the sequence)`
        }
        if (filteredOut > 0) {
          message += ` (${filteredOut} were filtered out as they were already in the sequence)`
        }
        setMessage(message)
        setSelectedContacts([])
        setSelectedSequence('')
        // Reload contacts in sequence to update the UI
        loadContactsInSequence(selectedSequence)
      } else {
        setMessage(result.error || 'Failed to trigger sequence')
      }
    } catch {
      setMessage('An error occurred while triggering the sequence')
    }

    setIsLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800'
      case 'qualified':
        return 'bg-green-100 text-green-800'
      case 'disqualified':
        return 'bg-red-100 text-red-800'
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800'
      case 'converted':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
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
              <Link href="/" className="text-xl font-semibold">
                CRM Marketing Automation
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trigger Email Sequence</h1>
              <p className="text-gray-600">Start an email sequence for selected contacts</p>
            </div>
            <Link href="/contacts">
              <Button variant="outline">Back to Contacts</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sequence Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Sequence</CardTitle>
                <CardDescription>
                  Choose which email sequence to trigger
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Sequence</label>
                  <Select value={selectedSequence} onValueChange={handleSequenceChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a sequence" />
                    </SelectTrigger>
                    <SelectContent>
                      {sequences.map((sequence) => (
                        <SelectItem key={sequence.id} value={sequence.id}>
                          {sequence.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedSequence && (
                  <div className="text-sm text-gray-600">
                    {sequences.find(s => s.id === selectedSequence)?.description || 'No description'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Selection */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Select Contacts</CardTitle>
                    <CardDescription>
                      Choose contacts to add to the sequence
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedContacts.length === contacts.filter(c => !contactsInSequence.includes(c.id)).length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Badge variant="outline">
                      {selectedContacts.length} selected
                    </Badge>
                    {contactsInSequence.length > 0 && (
                      <Badge variant="secondary">
                        {contactsInSequence.length} in sequence
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact) => {
                        const isInSequence = contactsInSequence.includes(contact.id)
                        const isSelected = selectedContacts.includes(contact.id)
                        
                        return (
                          <TableRow key={contact.id} className={isInSequence ? 'bg-gray-50' : ''}>
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleContactToggle(contact.id)}
                                disabled={isInSequence}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {contact.name || 'No name'}
                                {isInSequence && (
                                  <Badge variant="secondary" className="text-xs">
                                    In Sequence
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{contact.email}</TableCell>
                            <TableCell>{contact.company || '-'}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(contact.lead_status)}>
                                {contact.lead_status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trigger Button */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              {message && (
                <div className={`mb-4 p-3 rounded-md ${
                  message.includes('Successfully') 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {message}
                </div>
              )}

              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Ready to Trigger Sequence</h3>
                  <p className="text-sm text-gray-600">
                    {selectedSequence && selectedContacts.length > 0 
                      ? `Will start "${sequences.find(s => s.id === selectedSequence)?.name}" for ${selectedContacts.length} contacts`
                      : 'Select a sequence and contacts to continue'
                    }
                  </p>
                </div>
                <Button
                  onClick={handleTriggerSequence}
                  disabled={!selectedSequence || selectedContacts.length === 0 || isLoading}
                  className="min-w-32"
                >
                  {isLoading ? (
                    'Triggering...'
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Trigger Sequence
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
