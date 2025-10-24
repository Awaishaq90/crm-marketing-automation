'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Users, Plus } from 'lucide-react'

interface Contact {
  id: string
  email: string
  name: string | null
  company: string | null
  lead_status: string
}

interface AddContactsToSequenceModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (contactIds: string[], startImmediately: boolean) => Promise<void>
  existingContactIds: string[]
}

export default function AddContactsToSequenceModal({
  isOpen,
  onClose,
  onAdd,
  existingContactIds
}: AddContactsToSequenceModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('')
  const [startImmediately, setStartImmediately] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const supabase = createClient()

  const loadContacts = useCallback(async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('contacts')
        .select('*')
        .not('id', 'in', `(${existingContactIds.join(',')})`)
        .order('name', { ascending: true })

      // Apply filters
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`)
      }

      if (statusFilter !== 'all') {
        query = query.eq('lead_status', statusFilter)
      }

      if (companyFilter) {
        query = query.ilike('company', `%${companyFilter}%`)
      }

      const { data: contactsData, error } = await query

      if (error) {
        console.error('Error loading contacts:', error)
      } else {
        setContacts(contactsData || [])
      }
    } catch (error) {
      console.error('Error loading contacts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, existingContactIds, searchTerm, statusFilter, companyFilter])

  useEffect(() => {
    if (isOpen) {
      loadContacts()
    }
  }, [isOpen, loadContacts])

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

  const handleAdd = async () => {
    if (selectedContacts.length === 0) return

    setIsAdding(true)
    try {
      await onAdd(selectedContacts, startImmediately)
      setSelectedContacts([])
      onClose()
    } catch (error) {
      console.error('Error adding contacts:', error)
    } finally {
      setIsAdding(false)
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Contacts to Sequence</DialogTitle>
          <DialogDescription>
            Select contacts to add to this email sequence. Contacts already in the sequence are excluded.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="disqualified">Disqualified</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter by company..."
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            />
            <Button variant="outline" onClick={loadContacts} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Apply Filters'}
            </Button>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedContacts.length === contacts.length && contacts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading contacts...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No contacts found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => (
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="start-immediately"
                  name="start-option"
                  checked={startImmediately}
                  onChange={() => setStartImmediately(true)}
                />
                <label htmlFor="start-immediately" className="text-sm">
                  Start immediately
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="add-paused"
                  name="start-option"
                  checked={!startImmediately}
                  onChange={() => setStartImmediately(false)}
                />
                <label htmlFor="add-paused" className="text-sm">
                  Add as paused
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {selectedContacts.length} selected
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAdding}>
            Cancel
          </Button>
          <Button 
            onClick={handleAdd} 
            disabled={selectedContacts.length === 0 || isAdding}
            className="min-w-24"
          >
            {isAdding ? (
              'Adding...'
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
