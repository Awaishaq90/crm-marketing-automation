'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useDebounce } from '@/lib/hooks/use-debounce'

export function QuickSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearch = useDebounce(searchValue, 150)

  // Update URL when debounced search value changes
  useEffect(() => {
    if (debouncedSearch !== searchParams.get('search')) {
      setIsSearching(true)
    }
    
    const params = new URLSearchParams(searchParams.toString())
    
    if (debouncedSearch) {
      params.set('search', debouncedSearch)
    } else {
      params.delete('search')
    }

    // Preserve other filter params
    const queryString = params.toString()
    router.push(`/contacts${queryString ? `?${queryString}` : ''}`)
  }, [debouncedSearch, router, searchParams])

  // Reset searching state when search params update
  useEffect(() => {
    setIsSearching(false)
  }, [searchParams])

  return (
    <div className="relative max-w-md">
      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${
        isSearching ? 'text-primary animate-pulse' : 'text-muted-foreground'
      }`} />
      <Input
        type="text"
        placeholder="Quick search by name or email..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="pl-10 h-12 text-base"
      />
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}

