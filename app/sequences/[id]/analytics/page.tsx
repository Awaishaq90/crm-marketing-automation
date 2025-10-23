import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart3, Mail, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface AnalyticsPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SequenceAnalyticsPage({ params }: AnalyticsPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch sequence details
  const { data: sequence, error: sequenceError } = await supabase
    .from('email_sequences')
    .select('*')
    .eq('id', id)
    .single()

  if (sequenceError || !sequence) {
    redirect('/sequences')
  }

  // Fetch analytics data
  const [
    { data: contactSequences },
    { data: emailLogs }
  ] = await Promise.all([
    // Contact sequences stats
    supabase
      .from('contact_sequences')
      .select('status')
      .eq('sequence_id', id),
    
    // Email logs for performance metrics
    supabase
      .from('email_logs')
      .select('status, sent_at, opened_at, clicked_at, open_count, click_count')
      .eq('sequence_id', id),
    
    // Total contacts in system
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true }),
    
    // Active contacts in this sequence
    supabase
      .from('contact_sequences')
      .select('id', { count: 'exact', head: true })
      .eq('sequence_id', id)
      .eq('status', 'active')
  ])

  // Calculate metrics
  const sequenceStats = contactSequences?.reduce((acc, cs) => {
    acc[cs.status] = (acc[cs.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const totalEmails = emailLogs?.length || 0
  const openedEmails = emailLogs?.filter(log => log.opened_at).length || 0
  const clickedEmails = emailLogs?.filter(log => log.clicked_at).length || 0
  
  // Calculate total opens and clicks across all emails
  const totalOpens = emailLogs?.reduce((sum, log) => sum + (log.open_count || 0), 0) || 0
  const totalClicks = emailLogs?.reduce((sum, log) => sum + (log.click_count || 0), 0) || 0
  
  const openRate = totalEmails > 0 ? ((openedEmails / totalEmails) * 100).toFixed(1) : '0'
  const clickRate = totalEmails > 0 ? ((clickedEmails / totalEmails) * 100).toFixed(1) : '0'

  // Recent activity (last 10 email logs)
  const { data: recentActivity } = await supabase
    .from('email_logs')
    .select(`
      *,
      contacts(name, email),
      email_templates(subject)
    `)
    .eq('sequence_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'opened':
        return 'bg-purple-100 text-purple-800'
      case 'clicked':
        return 'bg-yellow-100 text-yellow-800'
      case 'bounced':
        return 'bg-red-100 text-red-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="text-sm text-gray-600 hover:text-gray-900">
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{sequence.name} - Analytics</h1>
              <p className="text-gray-600">Performance metrics and insights</p>
            </div>
            <Link href={`/sequences/${id}`}>
              <button className="text-sm text-blue-600 hover:text-blue-800">
                ← Back to Sequence
              </button>
            </Link>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(sequenceStats).reduce((a, b) => a + b, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  All time participants
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sequenceStats.active || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Currently in sequence
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clickRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {clickedEmails} of {totalEmails} emails ({totalClicks} total clicks)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {openedEmails} of {totalEmails} emails ({totalOpens} total opens)
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sequence Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Sequence Status</CardTitle>
                <CardDescription>
                  Breakdown of contact progression
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(sequenceStats).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Badge className={status === 'active' ? 'bg-green-100 text-green-800' : 
                                          status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                          status === 'unsubscribed' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'}>
                          {status}
                        </Badge>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Email engagement statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Emails Sent</span>
                    <span className="font-medium">{totalEmails}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Emails Opened</span>
                    <span className="font-medium">{openedEmails}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Emails Clicked</span>
                    <span className="font-medium">{clickedEmails}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Open Rate</span>
                    <span className="font-medium text-green-600">{openRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Click Rate</span>
                    <span className="font-medium text-blue-600">{clickRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest email interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity && recentActivity.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Opened</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {activity.contacts?.name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {activity.contacts?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {activity.email_templates?.subject || 'No subject'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(activity.status)}>
                            {activity.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {activity.sent_at 
                            ? new Date(activity.sent_at).toLocaleDateString()
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {activity.opened_at 
                            ? new Date(activity.opened_at).toLocaleDateString()
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
