'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Play, Pause, Trash2, Mail } from 'lucide-react'

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

interface SequenceContactsTableProps {
  contacts: ContactInSequence[]
  onStatusChange: (contactSequenceIds: string[], status: 'active' | 'paused') => Promise<void>
  onRemove: (contactSequenceIds: string[]) => Promise<void>
  isLoading?: boolean
}

export default function SequenceContactsTable({ 
  contacts, 
  onStatusChange, 
  onRemove, 
  isLoading = false 
}: SequenceContactsTableProps) {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [processingContacts, setProcessingContacts] = useState<string[]>([])

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

  const handleBulkAction = async (action: 'pause' | 'resume' | 'remove') => {
    if (selectedContacts.length === 0) return

    setProcessingContacts(selectedContacts)
    try {
      if (action === 'remove') {
        await onRemove(selectedContacts)
      } else {
        await onStatusChange(selectedContacts, action === 'resume' ? 'active' : 'paused')
      }
      setSelectedContacts([])
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error)
    } finally {
      setProcessingContacts([])
    }
  }

  const handleIndividualAction = async (contactId: string, action: 'pause' | 'resume' | 'remove') => {
    setProcessingContacts([contactId])
    try {
      if (action === 'remove') {
        await onRemove([contactId])
      } else {
        await onStatusChange([contactId], action === 'resume' ? 'active' : 'paused')
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error)
    } finally {
      setProcessingContacts([])
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'unsubscribed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLeadStatusColor = (status: string) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading contacts...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('resume')}
              disabled={processingContacts.length > 0}
            >
              <Play className="w-4 h-4 mr-1" />
              Resume
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('pause')}
              disabled={processingContacts.length > 0}
            >
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('remove')}
              disabled={processingContacts.length > 0}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedContacts.length === contacts.length && contacts.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Emails Sent</TableHead>
              <TableHead>Last Sent</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                  No contacts in this sequence yet
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
                  <TableCell>
                    <div>
                      <div className="font-medium">{contact.name || 'No name'}</div>
                      <div className="text-sm text-gray-500">{contact.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{contact.company || '-'}</span>
                      <Badge className={getLeadStatusColor(contact.lead_status)}>
                        {contact.lead_status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(contact.status)}>
                      {contact.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Step {contact.current_step}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 w-16">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(contact.current_step / 4) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{contact.emails_sent}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.last_sent_at 
                      ? new Date(contact.last_sent_at).toLocaleDateString()
                      : 'Not sent'
                    }
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={processingContacts.includes(contact.id)}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {contact.status === 'active' ? (
                          <DropdownMenuItem onClick={() => handleIndividualAction(contact.id, 'pause')}>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleIndividualAction(contact.id, 'resume')}>
                            <Play className="w-4 h-4 mr-2" />
                            Resume
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleIndividualAction(contact.id, 'remove')}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
