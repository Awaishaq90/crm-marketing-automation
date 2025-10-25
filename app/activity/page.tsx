import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { fetchRecentActivities, getTotalActivityCount, formatActivityTimestamp, type ActivityItem } from '@/lib/activity-queries'
import { 
  Mail, 
  MailCheck, 
  Eye, 
  MousePointerClick, 
  MailX, 
  Reply, 
  UserPlus, 
  Layers, 
  Users,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

function getActivityIcon(type: ActivityItem['type']) {
  const iconProps = { className: "w-4 h-4" }
  
  switch (type) {
    case 'email_sent':
      return <Mail {...iconProps} style={{ color: '#3b82f6' }} />
    case 'email_delivered':
      return <MailCheck {...iconProps} style={{ color: '#10b981' }} />
    case 'email_opened':
      return <Eye {...iconProps} style={{ color: '#3b82f6' }} />
    case 'email_clicked':
      return <MousePointerClick {...iconProps} style={{ color: '#8b5cf6' }} />
    case 'email_bounced':
      return <MailX {...iconProps} style={{ color: '#ef4444' }} />
    case 'email_replied':
      return <Reply {...iconProps} style={{ color: '#10b981' }} />
    case 'contact_added':
      return <UserPlus {...iconProps} style={{ color: '#10b981' }} />
    case 'sequence_created':
      return <Layers {...iconProps} style={{ color: '#8b5cf6' }} />
    case 'group_created':
      return <Users {...iconProps} style={{ color: '#14b8a6' }} />
    default:
      return <Mail {...iconProps} />
  }
}

const ITEMS_PER_PAGE = 20

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get page from search params, default to 1
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1', 10))
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  // Fetch total count and activities in parallel
  const [totalCount, activities] = await Promise.all([
    getTotalActivityCount(),
    fetchRecentActivities(ITEMS_PER_PAGE + 1, offset)
  ])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const hasMore = activities.length > ITEMS_PER_PAGE
  const displayActivities = hasMore ? activities.slice(0, ITEMS_PER_PAGE) : activities

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
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Recent Activity</h2>
            <p className="text-muted-foreground">
              All activity across your CRM including email events and system actions
            </p>
          </div>

          <Card className="card-shadow border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Activity Log</CardTitle>
              <CardDescription>
                Page {currentPage} of {totalPages || 1} - Showing {displayActivities.length} {displayActivities.length === 1 ? 'activity' : 'activities'} ({totalCount} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {displayActivities.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {displayActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 text-sm border-b border-border pb-4 last:border-b-0 last:pb-0">
                        <div className="flex-shrink-0 mt-0.5">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatActivityTimestamp(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {(currentPage > 1 || hasMore) && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        {currentPage > 1 ? (
                          <Link href={`/activity?page=${currentPage - 1}`}>
                            <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                              <ChevronLeft className="w-4 h-4 mr-1" />
                              Previous
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                          </Button>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {hasMore ? (
                          <Link href={`/activity?page=${currentPage + 1}`}>
                            <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                              Next
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No recent activity found. Start by adding contacts or creating email sequences.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
