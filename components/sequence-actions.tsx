'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SequenceActionsProps {
  sequenceId: string
  sequenceName: string
}

export default function SequenceActions({ sequenceId }: SequenceActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/sequences/${sequenceId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        // Refresh the page to show updated sequences
        router.refresh()
      } else {
        alert(result.error || 'Failed to delete sequence')
      }
    } catch (error) {
      console.error('Error deleting sequence:', error)
      alert('An error occurred while deleting the sequence')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex space-x-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowConfirm(true)}
      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  )
}
