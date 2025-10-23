'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'

export default function GroupsPage() {
  const [groups, setGroups] = useState<Array<{
    id: string;
    name: string;
    description: string | null;
    color: string;
    created_at: string;
    member_count: number;
  }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<{
    id: string;
    email?: string;
  } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // Fetch groups with member count
      const { data: groups, error } = await supabase
        .from('contact_groups')
        .select(`
          *,
          member_count:contact_group_members(count)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching groups:', error)
      } else {
        // Transform the data to include actual member count
        const groupsWithCount = groups?.map(group => ({
          ...group,
          member_count: group.member_count?.[0]?.count || 0
        })) || []
        setGroups(groupsWithCount)
      }
      setIsLoading(false)
    }

    fetchData()
  }, [supabase, router])

  const handleDeleteGroup = async (groupId: string) => {
    if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/groups/${groupId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          // Remove the group from the local state
          setGroups(prev => prev.filter(group => group.id !== groupId))
        } else {
          alert('Failed to delete group')
        }
      } catch (error) {
        console.error('Error deleting group:', error)
        alert('Failed to delete group')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading groups...</p>
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
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
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
              <h1 className="text-2xl font-bold text-foreground">Contact Groups</h1>
              <p className="text-muted-foreground">Organize your contacts into groups for better management</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/groups/new">
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </Link>
            </div>
          </div>

          <Card className="card-shadow border-border">
            <CardHeader>
              <CardTitle className="text-foreground">All Groups</CardTitle>
              <CardDescription>
                {groups.length} groups in your database
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group) => (
                    <Card key={group.id} className="card-shadow border-border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: group.color }}
                            ></div>
                            <CardTitle className="text-lg font-semibold text-foreground">
                              {group.name}
                            </CardTitle>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            {group.member_count}
                          </Badge>
                        </div>
                        {group.description && (
                          <CardDescription className="text-sm">
                            {group.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex space-x-2">
                          <Link href={`/groups/${group.id}`}>
                            <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/groups/${group.id}/edit`}>
                            <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            onClick={() => handleDeleteGroup(group.id)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No groups found</p>
                  <Link href="/groups/new">
                    <Button className="bg-primary hover:bg-primary/90">Create your first group</Button>
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
