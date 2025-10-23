'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function NewGroupPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage(result.error || 'Failed to create group')
      } else {
        router.push('/groups')
      }
    } catch {
      setMessage('An error occurred while creating the group')
    }

    setIsLoading(false)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const colorOptions = [
    { value: '#3B82F6', label: 'Blue', color: '#3B82F6' },
    { value: '#10B981', label: 'Green', color: '#10B981' },
    { value: '#F59E0B', label: 'Yellow', color: '#F59E0B' },
    { value: '#EF4444', label: 'Red', color: '#EF4444' },
    { value: '#8B5CF6', label: 'Purple', color: '#8B5CF6' },
    { value: '#EC4899', label: 'Pink', color: '#EC4899' },
    { value: '#6B7280', label: 'Gray', color: '#6B7280' },
    { value: '#F97316', label: 'Orange', color: '#F97316' }
  ]

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <nav className="bg-white shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                CRM Marketing Automation
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card className="card-shadow border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Create New Group</CardTitle>
              <CardDescription>
                Create a new contact group to organize your contacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground font-medium">Group Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., VIP Customers, Newsletter Subscribers"
                    required
                    className="border-input focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground font-medium">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Optional description of this group..."
                    className="border-input focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Group Color</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleChange('color', option.value)}
                        className={`w-12 h-12 rounded-lg border-2 transition-all ${
                          formData.color === option.value
                            ? 'border-foreground scale-110'
                            : 'border-border hover:border-primary'
                        }`}
                        style={{ backgroundColor: option.color }}
                        title={option.label}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose a color to help identify this group
                  </p>
                </div>

                {message && (
                  <div className={`p-3 rounded-md ${
                    message.includes('Error') || message.includes('Failed') 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    {message}
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? 'Creating...' : 'Create Group'}
                  </Button>
                  <Link href="/groups">
                    <Button type="button" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
