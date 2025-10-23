'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface CSVRow {
  name: string
  email: string
  phone?: string
  company?: string
  lead_status?: string
  tags?: string[]
  facebook_url?: string
  instagram_url?: string
  linkedin_url?: string
  website_url?: string
  address?: string
}

export default function ImportContactsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CSVRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      parseCSV(selectedFile)
    } else {
      setMessage('Please select a valid CSV file')
    }
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        setMessage('CSV file must have at least a header row and one data row')
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const row: CSVRow = { name: '', email: '' }
        
        headers.forEach((header, index) => {
          const value = values[index] || ''
          switch (header) {
            case 'name':
            case 'full name':
              row.name = value
              break
            case 'email':
            case 'email address':
              row.email = value
              break
            case 'phone':
            case 'phone number':
              row.phone = value
              break
            case 'company':
              row.company = value
              break
            case 'status':
            case 'lead status':
              row.lead_status = value || 'new'
              break
            case 'tags':
              row.tags = value ? value.split(',').map(tag => tag.trim()) : undefined
              break
            case 'website':
            case 'website url':
            case 'website_url':
              row.website_url = value
              break
            case 'linkedin':
            case 'linkedin url':
            case 'linkedin_url':
              row.linkedin_url = value
              break
            case 'facebook':
            case 'facebook url':
            case 'facebook_url':
              row.facebook_url = value
              break
            case 'instagram':
            case 'instagram url':
            case 'instagram_url':
              row.instagram_url = value
              break
            case 'address':
              row.address = value
              break
          }
        })
        
        return row
      }).filter(row => row.email) // Only include rows with email

      setPreview(data.slice(0, 10)) // Show first 10 rows
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!file) return

    setIsLoading(true)
    setMessage('')

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        
        const contacts = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim())
          const row: Partial<CSVRow> = {}
          
          headers.forEach((header, index) => {
            const value = values[index] || ''
            switch (header) {
              case 'name':
              case 'full name':
                row.name = value
                break
              case 'email':
              case 'email address':
                row.email = value
                break
              case 'phone':
              case 'phone number':
                row.phone = value
                break
              case 'company':
                row.company = value
                break
              case 'status':
              case 'lead status':
                row.lead_status = value || 'new'
                break
              case 'tags':
                row.tags = value ? value.split(',').map(tag => tag.trim()) : undefined
                break
              case 'website':
              case 'website url':
              case 'website_url':
                row.website_url = value
                break
              case 'linkedin':
              case 'linkedin url':
              case 'linkedin_url':
                row.linkedin_url = value
                break
              case 'facebook':
              case 'facebook url':
              case 'facebook_url':
                row.facebook_url = value
                break
              case 'instagram':
              case 'instagram url':
              case 'instagram_url':
                row.instagram_url = value
                break
              case 'address':
                row.address = value
                break
            }
          })
          
          return row
        }).filter(row => row.email)

        const { error } = await supabase
          .from('contacts')
          .insert(contacts)

        if (error) {
          setMessage(`Error importing contacts: ${error.message}`)
        } else {
          setMessage(`Successfully imported ${contacts.length} contacts!`)
        }
      }
      reader.readAsText(file)
    } catch (err) {
      console.error('Import error:', err)
      setMessage('An error occurred while importing contacts')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-semibold">
                CRM Marketing Automation
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Import Contacts</h1>
              <p className="text-gray-600">Upload a CSV file to import multiple contacts</p>
            </div>
            <Link href="/contacts">
              <Button variant="outline">Back to Contacts</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>Upload CSV File</CardTitle>
                <CardDescription>
                  Select a CSV file with contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-4" />
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer"
                  >
                    <Button variant="outline" asChild>
                      <span>Choose CSV File</span>
                    </Button>
                  </label>
                  {file && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {file.name}
                    </p>
                  )}
                </div>

                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">CSV Format Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>First row must contain headers</li>
                    <li>Required columns: email</li>
                    <li>Optional columns: name, phone, company, status, tags</li>
                    <li>Separate multiple tags with commas</li>
                  </ul>
                </div>

                {message && (
                  <div className={`p-3 rounded-md ${
                    message.includes('Successfully') 
                      ? 'bg-green-50 text-green-700' 
                      : 'bg-red-50 text-red-700'
                  }`}>
                    <div className="flex items-center">
                      {message.includes('Successfully') ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <AlertCircle className="w-4 h-4 mr-2" />
                      )}
                      {message}
                    </div>
                  </div>
                )}

                {preview.length > 0 && (
                  <div className="space-y-3">
                    <Button 
                      onClick={handleImport} 
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Importing...' : `Import ${preview.length} Contacts`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview Section */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  First 10 rows from your CSV file
                </CardDescription>
              </CardHeader>
              <CardContent>
                {preview.length > 0 ? (
                  <div className="space-y-3">
                    {preview.map((row, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-gray-50">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Name:</span> {row.name || '-'}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span> {row.email}
                          </div>
                          {row.phone && (
                            <div>
                              <span className="font-medium">Phone:</span> {row.phone}
                            </div>
                          )}
                          {row.company && (
                            <div>
                              <span className="font-medium">Company:</span> {row.company}
                            </div>
                          )}
                          {row.lead_status && (
                            <div>
                              <span className="font-medium">Status:</span> {row.lead_status}
                            </div>
                          )}
                          {row.tags && (
                            <div className="col-span-2">
                              <span className="font-medium">Tags:</span> {row.tags}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2" />
                    <p>Upload a CSV file to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
