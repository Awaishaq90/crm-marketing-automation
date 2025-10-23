import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Upload } from 'lucide-react'
import Link from 'next/link'
import { ContactsFilter } from '@/components/contacts-filter'
import { QuickSearch } from '@/components/quick-search'
import { StatusSelect } from '@/components/status-select'

type SearchParams = Promise<{
  search?: string
  company?: string
  status?: string
}>

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get filter values from URL params
  const params = await searchParams
  const searchQuery = params.search || ''
  const companyQuery = params.company || ''
  const statusQuery = params.status || ''

  // Build query with filters
  let query = supabase
    .from('contacts')
    .select('*')

  // Apply search filter (name or email)
  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
  }

  // Apply company filter
  if (companyQuery) {
    query = query.ilike('company', `%${companyQuery}%`)
  }

  // Apply status filter
  if (statusQuery) {
    query = query.eq('lead_status', statusQuery)
  }

  // Fetch contacts with filters
  const { data: contacts, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching contacts:', error)
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
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <form action="/api/auth/logout" method="post">
                <Button type="submit" variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
              <p className="text-muted-foreground">Manage your contact database</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/contacts/import">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </Button>
              </Link>
              <Link href="/contacts/new">
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </Link>
            </div>
          </div>

          <div className="mb-6">
            <QuickSearch />
          </div>

          <ContactsFilter />

          <Card className="card-shadow border-border">
            <CardHeader>
              <CardTitle className="text-foreground">All Contacts</CardTitle>
              <CardDescription>
                {contacts?.length || 0} contacts in your database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contacts && contacts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">
                          {contact.name || 'No name'}
                        </TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.company || '-'}</TableCell>
                        <TableCell>
                          <StatusSelect 
                            contactId={contact.id} 
                            currentStatus={contact.lead_status}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(contact.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Link href={`/contacts/${contact.id}`}>
                            <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No contacts found</p>
                  <Link href="/contacts/new">
                    <Button className="bg-primary hover:bg-primary/90">Add your first contact</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
