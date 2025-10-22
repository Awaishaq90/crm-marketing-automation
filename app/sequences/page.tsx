import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Mail, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default async function SequencesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch sequences with template count
  const { data: sequences, error } = await supabase
    .from('email_sequences')
    .select(`
      *,
      email_templates(count)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching sequences:', error)
  }

  // Fetch active contact sequences count for each sequence
  const sequenceStats = await Promise.all(
    (sequences || []).map(async (sequence) => {
      const { count: activeCount } = await supabase
        .from('contact_sequences')
        .select('*', { count: 'exact', head: true })
        .eq('sequence_id', sequence.id)
        .eq('status', 'active')

      const { count: completedCount } = await supabase
        .from('contact_sequences')
        .select('*', { count: 'exact', head: true })
        .eq('sequence_id', sequence.id)
        .eq('status', 'completed')

      return {
        ...sequence,
        active_contacts: activeCount || 0,
        completed_contacts: completedCount || 0
      }
    })
  )

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
              <h1 className="text-2xl font-bold text-foreground">Email Sequences</h1>
              <p className="text-muted-foreground">Create and manage automated email campaigns</p>
            </div>
            <Link href="/sequences/new">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Sequence
              </Button>
            </Link>
          </div>

          <Card className="card-shadow border-border">
            <CardHeader>
              <CardTitle className="text-foreground">All Sequences</CardTitle>
              <CardDescription>
                {sequences?.length || 0} sequences in your system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sequences && sequences.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Templates</TableHead>
                      <TableHead>Intervals</TableHead>
                      <TableHead>Active Contacts</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sequenceStats.map((sequence) => (
                      <TableRow key={sequence.id}>
                        <TableCell className="font-medium">
                          {sequence.name}
                        </TableCell>
                        <TableCell>
                          {sequence.description || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {sequence.email_templates?.[0]?.count || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          {sequence.intervals.join(', ')} days
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {sequence.active_contacts}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={sequence.active ? 'bg-status-qualified-bg text-status-qualified border-status-qualified/20' : 'bg-muted text-muted-foreground border-border'}>
                            {sequence.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(sequence.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Link href={`/sequences/${sequence.id}`}>
                              <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                                Edit
                              </Button>
                            </Link>
                            <Link href={`/sequences/${sequence.id}/analytics`}>
                              <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                                <BarChart3 className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No sequences found</p>
                  <Link href="/sequences/new">
                    <Button className="bg-primary hover:bg-primary/90">Create your first sequence</Button>
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
