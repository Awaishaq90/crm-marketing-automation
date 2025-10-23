'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LEAD_STATUSES } from '@/lib/constants'
import Link from 'next/link'

export default function ContactEditPage() {
  const [contactId, setContactId] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    lead_status: 'new' as const,
    tags: '',
    facebook_url: '',
    instagram_url: '',
    linkedin_url: '',
    website_url: '',
    address: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingContact, setIsLoadingContact] = useState(true)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const params = useParams()
  
  // Get contact ID from params
  useEffect(() => {
    if (params.id) {
      setContactId(params.id as string)
    }
  }, [params.id])

  // Fetch contact data
  useEffect(() => {
    if (!contactId) return

    const fetchContact = async () => {
      try {
        const { data: contact, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', contactId)
          .single()

        if (error) {
          setMessage('Contact not found')
          return
        }

        if (contact) {
          setFormData({
            name: contact.name || '',
            email: contact.email || '',
            phone: contact.phone || '',
            company: contact.company || '',
            lead_status: contact.lead_status || 'new',
            tags: contact.tags ? contact.tags.join(', ') : '',
            facebook_url: contact.facebook_url || '',
            instagram_url: contact.instagram_url || '',
            linkedin_url: contact.linkedin_url || '',
            website_url: contact.website_url || '',
            address: contact.address || ''
          })
        }
    } catch {
      setMessage('Error loading contact')
    } finally {
        setIsLoadingContact(false)
      }
    }

    fetchContact()
  }, [contactId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : null
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage(result.error || 'Failed to update contact')
      } else {
        router.push(`/contacts/${contactId}`)
      }
    } catch {
      setMessage('An error occurred while updating the contact')
    }

    setIsLoading(false)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isLoadingContact) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading contact...</p>
        </div>
      </div>
    )
  }

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
              <CardTitle className="text-foreground">Edit Contact</CardTitle>
              <CardDescription>
                Update contact information in your CRM system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground font-medium">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="John Doe"
                      className="border-input focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="john@example.com"
                      required
                      className="border-input focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground font-medium">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="border-input focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-foreground font-medium">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleChange('company', e.target.value)}
                      placeholder="Acme Inc."
                      className="border-input focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead_status" className="text-foreground font-medium">Lead Status</Label>
                  <Select value={formData.lead_status} onValueChange={(value) => handleChange('lead_status', value)}>
                    <SelectTrigger className="border-input focus:ring-primary focus:border-primary">
                      <SelectValue placeholder="Select lead status" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-foreground font-medium">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                    placeholder="VIP, Customer, Newsletter (comma-separated)"
                    className="border-input focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Social Media & Business</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website_url" className="text-foreground font-medium">Website</Label>
                      <Input
                        id="website_url"
                        value={formData.website_url}
                        onChange={(e) => handleChange('website_url', e.target.value)}
                        placeholder="https://example.com"
                        className="border-input focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin_url" className="text-foreground font-medium">LinkedIn</Label>
                      <Input
                        id="linkedin_url"
                        value={formData.linkedin_url}
                        onChange={(e) => handleChange('linkedin_url', e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        className="border-input focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebook_url" className="text-foreground font-medium">Facebook</Label>
                      <Input
                        id="facebook_url"
                        value={formData.facebook_url}
                        onChange={(e) => handleChange('facebook_url', e.target.value)}
                        placeholder="https://facebook.com/username"
                        className="border-input focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram_url" className="text-foreground font-medium">Instagram</Label>
                      <Input
                        id="instagram_url"
                        value={formData.instagram_url}
                        onChange={(e) => handleChange('instagram_url', e.target.value)}
                        placeholder="https://instagram.com/username"
                        className="border-input focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-foreground font-medium">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="123 Main St, City, State 12345"
                      className="border-input focus:ring-primary focus:border-primary"
                    />
                  </div>
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
                    {isLoading ? 'Updating...' : 'Update Contact'}
                  </Button>
                  <Link href={`/contacts/${contactId}`}>
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
