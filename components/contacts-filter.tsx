'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Filter, X } from 'lucide-react'
import { useState } from 'react'

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'disqualified', label: 'Disqualified' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'converted', label: 'Converted' },
]

export function ContactsFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [company, setCompany] = useState(searchParams.get('company') || '')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')

  // Update URL when filters change
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Preserve search param from QuickSearch
    if (company) {
      params.set('company', company)
    } else {
      params.delete('company')
    }
    
    if (status && status !== 'all') {
      params.set('status', status)
    } else {
      params.delete('status')
    }

    const queryString = params.toString()
    router.push(`/contacts${queryString ? `?${queryString}` : ''}`)
  }

  // Clear all filters
  const clearFilters = () => {
    setCompany('')
    setStatus('all')
    
    // Preserve search param from QuickSearch
    const params = new URLSearchParams(searchParams.toString())
    params.delete('company')
    params.delete('status')
    
    const queryString = params.toString()
    router.push(`/contacts${queryString ? `?${queryString}` : ''}`)
  }

  // Check if any filters are active
  const hasActiveFilters = company || (status && status !== 'all')

  // Apply filters when Enter is pressed
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilters()
    }
  }

  return (
    <Card className="card-shadow border-border mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Advanced Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <Label htmlFor="company" className="text-sm font-medium mb-2 block">
              Company
            </Label>
            <Input
              id="company"
              placeholder="Filter by company..."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="md:col-span-1">
            <Label htmlFor="status" className="text-sm font-medium mb-2 block">
              Status
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-1 flex items-end gap-2">
            <Button 
              onClick={applyFilters}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Apply Filters
            </Button>
            {hasActiveFilters && (
              <Button 
                onClick={clearFilters}
                variant="outline"
                size="icon"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

