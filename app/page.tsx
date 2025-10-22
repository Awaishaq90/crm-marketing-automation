import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function Dashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch dashboard metrics
  const [
    { data: contacts },
    { data: sequences },
    { data: emailLogs },
    { data: activeSequences }
  ] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }),
    supabase.from('email_sequences').select('id', { count: 'exact', head: true }),
    supabase.from('email_logs').select('id', { count: 'exact', head: true }),
    supabase.from('contact_sequences').select('id', { count: 'exact', head: true }).eq('status', 'active')
  ])

  const totalContacts = contacts?.length || 0
  const totalSequences = sequences?.length || 0
  const totalEmailsSent = emailLogs?.length || 0
  const activeContacts = activeSequences?.length || 0

  // Calculate open rate
  const { data: openedEmails } = await supabase
    .from('email_logs')
    .select('id', { count: 'exact', head: true })
    .not('opened_at', 'is', null)

  const openRate = totalEmailsSent > 0 ? ((openedEmails?.length || 0) / totalEmailsSent * 100).toFixed(1) : '0'

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
                <CardTitle className="text-sm font-medium text-foreground">Open Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{openRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {openedEmails?.length || 0} opened emails
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
                <Link href="/contacts/trigger-sequence">
                  <Button variant="outline" className="w-full justify-start border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    Trigger Sequence
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
                <p className="text-sm text-muted-foreground">
                  No recent activity. Start by adding contacts or creating email sequences.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
