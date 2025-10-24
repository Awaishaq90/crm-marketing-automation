'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Edit, Trash2, Plus, Mail, Users } from 'lucide-react'
import Link from 'next/link'
import AddContactsToGroup from '@/components/add-contacts-to-group'
import { StatusSelect } from '@/components/status-select'

export default function GroupDetailPage() {
  const [group, setGroup] = useState<{
    id: string;
    name: string;
    description: string | null;
    color: string;
    created_at: string;
  } | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [members, setMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [user, setUser] = useState<{
    id: string;
    email?: string;
  } | null>(null)
  const [showAddContacts, setShowAddContacts] = useState(false)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const fetchGroup = useCallback(async (groupId: string) => {
    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: group, error } = await supabase
        .from('contact_groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (error) {
        console.error('Error fetching group:', error)
        router.push('/groups')
        return
      }

      setGroup(group)
    } catch (error) {
      console.error('Error fetching group:', error)
      router.push('/groups')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, router])

  const fetchMembers = useCallback(async (groupId: string) => {
    try {
      const { data: members, error } = await supabase
        .from('contact_group_members')
        .select(`
          id,
          added_at,
          contacts (
            id,
            name,
            email,
            phone,
            company,
            lead_status
          )
        `)
        .eq('group_id', groupId)
        .order('added_at', { ascending: false })

      if (error) {
        console.error('Error fetching group members:', error)
      } else {
        setMembers(members || [])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setIsLoadingMembers(false)
    }
  }, [supabase])

  // Get group ID from params
  useEffect(() => {
    if (params.id) {
      fetchGroup(params.id as string)
      fetchMembers(params.id as string)
    }
  }, [params.id, fetchGroup, fetchMembers])

  const handleDeleteGroup = async () => {
    if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/groups/${params.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          router.push('/groups')
        } else {
          alert('Failed to delete group')
        }
      } catch (error) {
        console.error('Error deleting group:', error)
        alert('Failed to delete group')
      }
    }
  }

  const handleRemoveMember = async (memberId: string, contactId: string) => {
    if (confirm('Are you sure you want to remove this contact from the group?')) {
      try {
        const response = await fetch(`/api/groups/${params.id}/members/${contactId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          // Remove from local state
          setMembers(prev => prev.filter(member => member.id !== memberId))
        } else {
          alert('Failed to remove contact from group')
        }
      } catch (error) {
        console.error('Error removing member:', error)
        alert('Failed to remove contact from group')
      }
    }
  }

  const handleContactsAdded = () => {
    // Refresh the members list
    if (params.id) {
      fetchMembers(params.id as string)
    }
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading group...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Group not found</p>
          <Link href="/groups">
            <Button className="mt-4">Back to Groups</Button>
          </Link>
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
            <div className="flex items-center space-x-3">
              <div 
                className="w-6 h-6 rounded-full" 
                style={{ backgroundColor: group.color }}
              ></div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
                {group.description && (
                  <p className="text-muted-foreground">{group.description}</p>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <Link href="/groups">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">Back to Groups</Button>
              </Link>
              <Link href={`/groups/${group.id}/edit`}>
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Group
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                onClick={handleDeleteGroup}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Group
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Group Info - Full width on all screens */}
            <Card className="card-shadow border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Group Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {members.length} contact{members.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: group.color }}
                  ></div>
                  <span className="text-sm text-foreground">Color: {group.color}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Created {new Date(group.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            {/* Members List - Full width with horizontal scroll */}
            <Card className="card-shadow border-border">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-foreground">Group Members</CardTitle>
                    <CardDescription>
                      {members.length} contact{members.length !== 1 ? 's' : ''} in this group
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setShowAddContacts(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contacts
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90">
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingMembers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading members...</p>
                  </div>
                ) : members.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table className="min-w-[800px] w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[140px]">Name</TableHead>
                          <TableHead className="min-w-[180px]">Email</TableHead>
                          <TableHead className="min-w-[120px]">Phone</TableHead>
                          <TableHead className="min-w-[120px]">Company</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="min-w-[120px]">Added</TableHead>
                          <TableHead className="min-w-[160px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium min-w-[140px]">
                              <div className="truncate max-w-[140px]" title={member.contacts?.name || 'No name'}>
                                {member.contacts?.name || 'No name'}
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[180px]">
                              <div className="truncate max-w-[180px]" title={member.contacts?.email}>
                                {member.contacts?.email}
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[120px]">
                              <div className="truncate max-w-[120px]" title={member.contacts?.phone || '-'}>
                                {member.contacts?.phone || '-'}
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[120px]">
                              <div className="truncate max-w-[120px]" title={member.contacts?.company || '-'}>
                                {member.contacts?.company || '-'}
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[100px]">
                              <StatusSelect
                                contactId={member.contacts?.id}
                                currentStatus={member.contacts?.lead_status || 'new'}
                              />
                            </TableCell>
                            <TableCell className="text-muted-foreground min-w-[120px]">
                              <div className="text-xs">
                                {new Date(member.added_at).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[160px]">
                              <div className="flex space-x-1">
                                <Link href={`/contacts/${member.contacts?.id}`}>
                                  <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs px-2 py-1">
                                    View
                                  </Button>
                                </Link>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white text-xs px-2 py-1"
                                  onClick={() => handleRemoveMember(member.id, member.contacts?.id)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No contacts in this group yet</p>
                    <Button 
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => setShowAddContacts(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Contacts
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Add Contacts Modal */}
      {showAddContacts && (
        <AddContactsToGroup
          groupId={params.id as string}
          onContactsAdded={handleContactsAdded}
          onClose={() => setShowAddContacts(false)}
        />
      )}
    </div>
  )
}
