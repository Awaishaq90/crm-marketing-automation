'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Mail, Edit } from 'lucide-react'
import Link from 'next/link'
import AddNoteModal from '@/components/add-note-modal'

interface ContactActionsProps {
  contactId: string
  contactName?: string
  onNoteAdded?: () => void
}

export default function ContactActions({ contactId, contactName, onNoteAdded }: ContactActionsProps) {
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [isAddingNote, setIsAddingNote] = useState(false)

  const handleAddNote = async (note: string) => {
    setIsAddingNote(true)
    try {
      const response = await fetch(`/api/contacts/${contactId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add note')
      }

      // Refresh the page to show the new note
      if (onNoteAdded) {
        onNoteAdded()
      } else {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Failed to add note. Please try again.')
    } finally {
      setIsAddingNote(false)
    }
  }

  return (
    <>
      <div className="flex space-x-3">
        <Link href="/contacts">
          <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            Back to Contacts
          </Button>
        </Link>
        <Link href={`/contacts/${contactId}/edit`}>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            <Edit className="w-4 h-4 mr-2" />
            Edit Contact
          </Button>
        </Link>
        <Link href={`/contacts/${contactId}/send-email`}>
          <Button className="bg-primary hover:bg-primary/90">
            <Mail className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        </Link>
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => setIsNoteModalOpen(true)}
          disabled={isAddingNote}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      <AddNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onAdd={handleAddNote}
        contactName={contactName}
      />
    </>
  )
}
