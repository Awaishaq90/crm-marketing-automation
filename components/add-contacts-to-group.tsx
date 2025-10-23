'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'

interface AddContactsToGroupProps {
  groupId: string
  onContactsAdded: () => void
  onClose: () => void
}

export default function AddContactsToGroup({ groupId, onContactsAdded, onClose }: AddContactsToGroupProps) {
  const [contacts, setContacts] = useState<Array<{
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    company: string | null;
    lead_status: string;
  }>>([])
  const [filteredContacts, setFilteredContacts] = useState<Array<{
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    company: string | null;
    lead_status: string;
  }>>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const fetchContacts = useCallback(async () => {
    try {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching contacts:', error)
        return
      }

      setContacts(contacts || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const filterContacts = useCallback(() => {
    if (!searchQuery) {
      setFilteredContacts(contacts)
      return
    }

    const filtered = contacts.filter(contact => 
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    setFilteredContacts(filtered)
  }, [contacts, searchQuery])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  useEffect(() => {
    filterContacts()
  }, [contacts, searchQuery, filterContacts])

  const handleContactSelect = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId])
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId))
    }
  }

  const handleAddContacts = async () => {
    if (selectedContacts.length === 0) {
      setMessage('Please select at least one contact')
      return
    }

    setIsAdding(true)
    setMessage('')

    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contactIds: selectedContacts }),
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage(result.error || 'Failed to add contacts to group')
      } else {
        setMessage(`Successfully added ${result.added} contacts to group`)
        setSelectedContacts([])
        onContactsAdded()
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch {
      setMessage('An error occurred while adding contacts to group')
    }

    setIsAdding(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-status-new-bg text-status-new border-status-new/20'
      case 'qualified':
        return 'bg-status-qualified-bg text-status-qualified border-status-qualified/20'
      case 'disqualified':
        return 'bg-status-disqualified-bg text-status-disqualified border-status-disqualified/20'
      case 'contacted':
        return 'bg-status-contacted-bg text-status-contacted border-status-contacted/20'
      case 'converted':
        return 'bg-status-converted-bg text-status-converted border-status-converted/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading contacts...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-foreground">Add Contacts to Group</CardTitle>
            <CardDescription>
              Select contacts to add to this group
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-foreground font-medium">Search Contacts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Selected count */}
            {selectedContacts.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-foreground">
                  {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedContacts([])}
                >
                  Clear Selection
                </Button>
              </div>
            )}

            {/* Contacts list */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={contact.id}
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={(checked) => handleContactSelect(contact.id, checked as boolean)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground truncate">
                            {contact.name || 'No name'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {contact.email}
                          </p>
                          {contact.company && (
                            <p className="text-xs text-muted-foreground truncate">
                              {contact.company}
                            </p>
                          )}
                        </div>
                        <Badge className={`${getStatusColor(contact.lead_status)} border font-medium text-xs`}>
                          {contact.lead_status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No contacts found matching your search' : 'No contacts available'}
                  </p>
                </div>
              )}
            </div>

            {/* Message */}
            {message && (
              <div className={`p-3 rounded-md ${
                message.includes('Error') || message.includes('Failed') 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddContacts}
                disabled={selectedContacts.length === 0 || isAdding}
                className="bg-primary hover:bg-primary/90"
              >
                {isAdding ? 'Adding...' : `Add ${selectedContacts.length} Contact${selectedContacts.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
