import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'
import Link from 'next/link'

export default async function Dashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch dashboard metrics
  const [
    { count: contactsCount },
    { count: sequencesCount },
    { count: emailLogsCount },
    { count: activeSequencesCount }
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('email_sequences').select('*', { count: 'exact', head: true }),
    supabase.from('email_logs').select('*', { count: 'exact', head: true }),
    supabase.from('contact_sequences').select('*', { count: 'exact', head: true }).eq('status', 'active')
  ])

  const totalContacts = contactsCount || 0
  const totalSequences = sequencesCount || 0
  const totalEmailsSent = emailLogsCount || 0
  const activeContacts = activeSequencesCount || 0

  // Calculate open rate and click rate
  const [
    { count: openedEmailsCount },
    { count: clickedEmailsCount }
  ] = await Promise.all([
    supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .not('opened_at', 'is', null),
    supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .not('clicked_at', 'is', null)
  ])

  const openRate = totalEmailsSent > 0 ? ((openedEmailsCount || 0) / totalEmailsSent * 100).toFixed(1) : '0'
  const clickRate = totalEmailsSent > 0 ? ((clickedEmailsCount || 0) / totalEmailsSent * 100).toFixed(1) : '0'

  // Fetch recent activity
  const [
    { data: recentEmails },
    { data: recentContacts },
    { data: recentSequences }
  ] = await Promise.all([
    supabase
      .from('email_logs')
      .select('id, sent_at, subject, email_type, contacts(name, email), email_templates(subject), email_sequences(name)')
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(3),
    supabase
      .from('contacts')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('contact_sequences')
      .select('id, started_at, contacts(name, email), email_sequences(name)')
      .order('started_at', { ascending: false })
      .limit(3)
  ])

  // Combine and sort all activity by timestamp
  type ActivityItem = {
    type: 'email' | 'contact' | 'sequence'
    timestamp: string
    description: string
  }

  const activities: ActivityItem[] = []

  recentEmails?.forEach(email => {
    if (email.sent_at) {
      const contact = email.contacts as { name?: string; email?: string } | null
      const template = email.email_templates as { subject?: string } | null
      const sequence = email.email_sequences as { name?: string } | null
      const subject = email.subject || template?.subject || 'No subject'
      const emailType = email.email_type === 'individual' ? 'Individual Email' : (sequence?.name || 'Unknown Sequence')
      activities.push({
        type: 'email',
        timestamp: email.sent_at,
        description: `Email sent to ${contact?.name || contact?.email || 'Unknown'}: ${subject} (${emailType})`
      })
    }
  })

  recentContacts?.forEach(contact => {
    activities.push({
      type: 'contact',
      timestamp: contact.created_at,
      description: `New contact added: ${contact.name || contact.email}`
    })
  })

  recentSequences?.forEach(seq => {
    const sequence = seq.email_sequences as { name?: string } | null
    const contact = seq.contacts as { name?: string; email?: string } | null
    activities.push({
      type: 'sequence',
      timestamp: seq.started_at,
      description: `Sequence "${sequence?.name || 'Unknown'}" started for ${contact?.name || contact?.email || 'Unknown'}`
    })
  })

  // Sort by timestamp (most recent first) and take top 5
  const sortedActivities = activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)

  // Helper function to format timestamp
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return past.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <nav className="bg-white shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                CRM Marketing Automation
              </h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="card-shadow border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totalContacts}</div>
                <p className="text-xs text-muted-foreground">
                  In your database
                </p>
              </CardContent>
            </Card>
            <Card className="card-shadow border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Email Sequences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totalSequences}</div>
                <p className="text-xs text-muted-foreground">
                  {activeContacts} active contacts
                </p>
              </CardContent>
            </Card>
            <Card className="card-shadow border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Emails Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totalEmailsSent}</div>
                <p className="text-xs text-muted-foreground">
                  All time
                </p>
              </CardContent>
            </Card>
            <Card className="card-shadow border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Click Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{clickRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {clickedEmailsCount || 0} clicked emails
                </p>
              </CardContent>
            </Card>
            <Card className="card-shadow border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Open Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{openRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {openedEmailsCount || 0} opened emails
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-shadow border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/contacts">
                  <Button className="w-full justify-start bg-primary hover:bg-primary/90">
                    View All Contacts
                  </Button>
                </Link>
                <Link href="/contacts/import">
                  <Button variant="outline" className="w-full justify-start border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    Import Contacts
                  </Button>
                </Link>
                <Link href="/sequences">
                  <Button variant="outline" className="w-full justify-start border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    Create Email Sequence
                  </Button>
                </Link>
                <Link href="/groups">
                  <Button variant="outline" className="w-full justify-start border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Groups
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="card-shadow border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates in your CRM
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sortedActivities.length > 0 ? (
                  <div className="space-y-4">
                    {sortedActivities.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 text-sm">
                        <div className="flex-shrink-0 mt-0.5">
                          {activity.type === 'email' && (
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                          {activity.type === 'contact' && (
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          )}
                          {activity.type === 'sequence' && (
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground truncate">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No recent activity. Start by adding contacts or creating email sequences.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
