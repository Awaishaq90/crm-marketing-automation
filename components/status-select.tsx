'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'

type LeadStatus = 'new' | 'qualified' | 'disqualified' | 'contacted' | 'converted'

interface StatusSelectProps {
  contactId: string
  currentStatus: LeadStatus
}

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'disqualified', label: 'Disqualified' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'converted', label: 'Converted' },
]

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

export function StatusSelect({ contactId, currentStatus }: StatusSelectProps) {
  const router = useRouter()
  const [status, setStatus] = useState<LeadStatus>(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true)
    setStatus(newStatus as LeadStatus) // Optimistic update

    try {
      const response = await fetch(`/api/contacts/${contactId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lead_status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
      // Revert on error
      setStatus(currentStatus)
      alert('Failed to update status. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Select 
      value={status} 
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger 
        className={`w-[140px] border font-medium ${getStatusColor(status)} ${
          isUpdating ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="cursor-pointer"
          >
            <span className={`inline-block px-2 py-1 rounded-md text-sm ${getStatusColor(option.value)}`}>
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

