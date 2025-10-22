'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, Users, Mail } from 'lucide-react'
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
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
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
  }

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(contacts.map(c => c.id))
    }
  }

  const handleTriggerSequence = async () => {
    if (!selectedSequence || selectedContacts.length === 0) {
      setMessage('Please select a sequence and at least one contact')
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
          contactIds: selectedContacts
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage(`Successfully added ${result.added} contacts to sequence${result.existing > 0 ? ` (${result.existing} were already in the sequence)` : ''}`)
        setSelectedContacts([])
        setSelectedSequence('')
      } else {
        setMessage(result.error || 'Failed to trigger sequence')
      }
    } catch (error) {
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
                  <Select value={selectedSequence} onValueChange={setSelectedSequence}>
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
                      {selectedContacts.length === contacts.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Badge variant="outline">
                      {selectedContacts.length} selected
                    </Badge>
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
                      {contacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedContacts.includes(contact.id)}
                              onCheckedChange={() => handleContactToggle(contact.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {contact.name || 'No name'}
                          </TableCell>
                          <TableCell>{contact.email}</TableCell>
                          <TableCell>{contact.company || '-'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(contact.lead_status)}>
                              {contact.lead_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
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
