import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Mail, Users, BarChart3, Edit } from 'lucide-react'
import Link from 'next/link'

interface SequencePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SequencePage({ params }: SequencePageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch sequence
  const { data: sequence, error: sequenceError } = await supabase
    .from('email_sequences')
    .select('*')
    .eq('id', id)
    .single()

  if (sequenceError || !sequence) {
    redirect('/sequences')
  }

  // Fetch templates
  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .eq('sequence_id', id)
    .order('order_index', { ascending: true })

  // Fetch contact sequences stats
  const { data: contactSequences } = await supabase
    .from('contact_sequences')
    .select('status')
    .eq('sequence_id', id)

  const stats = contactSequences?.reduce((acc, cs) => {
    acc[cs.status] = (acc[cs.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

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
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <form action="/api/auth/logout" method="post">
                <Button type="submit" variant="outline" size="sm">
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
              <h1 className="text-2xl font-bold text-gray-900">{sequence.name}</h1>
              <p className="text-gray-600">{sequence.description || 'No description'}</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/sequences">
                <Button variant="outline">Back to Sequences</Button>
              </Link>
              <Link href={`/sequences/${id}/analytics`}>
                <Button variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              <Button>
                <Edit className="w-4 h-4 mr-2" />
                Edit Sequence
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Sequence Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Currently in sequence
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Finished sequence
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.unsubscribed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Opted out
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sequence Details */}
            <Card>
              <CardHeader>
                <CardTitle>Sequence Details</CardTitle>
                <CardDescription>
                  Configuration and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">
                    <Badge className={sequence.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {sequence.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Email Intervals</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {sequence.intervals.join(', ')} days between emails
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Created</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(sequence.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Email Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  {templates?.length || 0} templates in this sequence
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templates && templates.length > 0 ? (
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <div key={template.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">Email {template.order_index}</h4>
                            <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                Day {sequence.intervals[template.order_index - 1] || 0}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No templates found</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest contacts added to this sequence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Step</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Last Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* This would be populated with actual contact data */}
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No recent activity
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
