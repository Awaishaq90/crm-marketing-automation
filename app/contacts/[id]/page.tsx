import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Mail, Phone, Building, Calendar, Tag, Globe } from 'lucide-react'
import Link from 'next/link'

interface ContactPageProps {
  params: {
    id: string
  }
}

export default async function ContactPage({ params }: ContactPageProps) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch contact
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (contactError || !contact) {
    redirect('/contacts')
  }

  // Fetch contact notes
  const { data: notes, error: notesError } = await supabase
    .from('contact_notes')
    .select(`
      *,
      created_by_user:created_by
    `)
    .eq('contact_id', params.id)
    .order('created_at', { ascending: false })

  // Fetch email logs for this contact
  const { data: emailLogs, error: emailLogsError } = await supabase
    .from('email_logs')
    .select(`
      *,
      email_sequences(name),
      email_templates(subject)
    `)
    .eq('contact_id', params.id)
    .order('created_at', { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-status-new-bg text-status-new border-status-new/20'
      case 'qualified':
        return 'bg-status-qualified-bg text-status-qualified border-status-qualified/20'
      case 'disqualified':
        return 'bg-status-disqualified-bg text-status-disqualified border-status-disqualified/20'
      case 'contacted':
        return 'bg-status-contacted-bg text-status-contacted border-status-contacted/20'
      case 'converted':
        return 'bg-status-converted-bg text-status-converted border-status-converted/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getEmailStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-status-qualified-bg text-status-qualified border-status-qualified/20'
      case 'delivered':
        return 'bg-info-bg text-info border-info/20'
      case 'opened':
        return 'bg-status-converted-bg text-status-converted border-status-converted/20'
      case 'clicked':
        return 'bg-status-contacted-bg text-status-contacted border-status-contacted/20'
      case 'replied':
        return 'bg-status-qualified-bg text-status-qualified border-status-qualified/20'
      case 'bounced':
        return 'bg-status-disqualified-bg text-status-disqualified border-status-disqualified/20'
      case 'failed':
        return 'bg-status-disqualified-bg text-status-disqualified border-status-disqualified/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
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
              <h1 className="text-2xl font-bold text-foreground">{contact.name || 'Unnamed Contact'}</h1>
              <p className="text-muted-foreground">{contact.email}</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/contacts">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">Back to Contacts</Button>
              </Link>
              <Link href={`/contacts/${params.id}/send-email`}>
                <Button className="bg-primary hover:bg-primary/90">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              </Link>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Details */}
            <div className="lg:col-span-1">
              <Card className="card-shadow border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Contact Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{contact.email}</span>
                  </div>
                  {contact.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{contact.phone}</span>
                    </div>
                  )}
                  {contact.company && (
                    <div className="flex items-center space-x-3">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{contact.company}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Added {new Date(contact.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getStatusColor(contact.lead_status)} border font-medium`}>
                      {contact.lead_status}
                    </Badge>
                  </div>
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex items-start space-x-3">
                      <Tag className="w-4 h-4 text-muted-foreground mt-1" />
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs border-primary text-primary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Social Media & Business Information */}
                  {contact.website_url && (
                    <div className="flex items-start space-x-3">
                      <Globe className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Website</p>
                        <a href={contact.website_url} target="_blank" rel="noopener noreferrer" 
                           className="text-sm text-primary hover:underline">
                          {contact.website_url}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {contact.linkedin_url && (
                    <div className="flex items-start space-x-3">
                      <div className="w-4 h-4 mt-1 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">in</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">LinkedIn</p>
                        <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" 
                           className="text-sm text-primary hover:underline">
                          {contact.linkedin_url}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {contact.facebook_url && (
                    <div className="flex items-start space-x-3">
                      <div className="w-4 h-4 mt-1 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">f</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Facebook</p>
                        <a href={contact.facebook_url} target="_blank" rel="noopener noreferrer" 
                           className="text-sm text-primary hover:underline">
                          {contact.facebook_url}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {contact.instagram_url && (
                    <div className="flex items-start space-x-3">
                      <div className="w-4 h-4 mt-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">ig</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Instagram</p>
                        <a href={contact.instagram_url} target="_blank" rel="noopener noreferrer" 
                           className="text-sm text-primary hover:underline">
                          {contact.instagram_url}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {contact.address && (
                    <div className="flex items-start space-x-3">
                      <Building className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Address</p>
                        <p className="text-sm text-foreground whitespace-pre-line">{contact.address}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Notes and Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Notes */}
              <Card className="card-shadow border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Notes</CardTitle>
                  <CardDescription>
                    Track interactions and important information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {notes && notes.length > 0 ? (
                    <div className="space-y-4">
                      {notes.map((note) => (
                        <div key={note.id} className="border-l-4 border-primary pl-4 py-2">
                          <p className="text-sm text-foreground">{note.note}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(note.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No notes yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Email History */}
              <Card className="card-shadow border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Email History</CardTitle>
                  <CardDescription>
                    All email interactions with this contact
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {emailLogs && emailLogs.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Sequence</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emailLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium text-foreground">
                              {log.email_templates?.subject || 'No subject'}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {log.email_sequences?.name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getEmailStatusColor(log.status)} border font-medium`}>
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {log.sent_at 
                                ? new Date(log.sent_at).toLocaleDateString()
                                : 'Not sent'
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-sm">No email history yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
