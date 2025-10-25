import { createClient } from '@/lib/supabase/server'

export type ActivityType = 
  | 'email_sent' 
  | 'email_delivered' 
  | 'email_opened' 
  | 'email_clicked' 
  | 'email_bounced' 
  | 'email_replied'
  | 'contact_added' 
  | 'sequence_created' 
  | 'group_created'

export interface ActivityItem {
  id: string
  type: ActivityType
  timestamp: string
  description: string
  metadata?: Record<string, unknown>
}

export async function getTotalActivityCount(): Promise<number> {
  const supabase = await createClient()
  
  // Count email events
  const { count: emailEventsCount } = await supabase
    .from('email_events')
    .select('*', { count: 'exact', head: true })
  
  // Count contacts
  const { count: contactsCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
  
  // Count sequences
  const { count: sequencesCount } = await supabase
    .from('email_sequences')
    .select('*', { count: 'exact', head: true })
  
  // Count groups
  const { count: groupsCount } = await supabase
    .from('contact_groups')
    .select('*', { count: 'exact', head: true })
  
  // Count email replies
  const { count: emailRepliesCount } = await supabase
    .from('email_replies')
    .select('*', { count: 'exact', head: true })
  
  return (emailEventsCount || 0) + (contactsCount || 0) + (sequencesCount || 0) + (groupsCount || 0) + (emailRepliesCount || 0)
}

export async function fetchRecentActivities(limit = 50, offset = 0): Promise<ActivityItem[]> {
  const supabase = await createClient()
  
  // Fetch email events with related data
  const { data: emailEvents } = await supabase
    .from('email_events')
    .select(`
      id,
      event_type,
      created_at,
      email_logs!inner(
        id,
        subject,
        email_type,
        contacts(name, email),
        email_templates(subject),
        email_sequences(name)
      )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Fetch contact additions
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, name, email, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Fetch sequence creations
  const { data: sequences } = await supabase
    .from('email_sequences')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Fetch group creations
  const { data: groups } = await supabase
    .from('contact_groups')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Fetch email replies
  const { data: emailReplies } = await supabase
    .from('email_replies')
    .select(`
      id,
      received_at,
      email_logs!inner(
        id,
        subject,
        contacts(name, email)
      )
    `)
    .order('received_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const activities: ActivityItem[] = []

  // Process email events
  emailEvents?.forEach(event => {
    const emailLog = event.email_logs as {
      id?: string
      subject?: string
      email_type?: string
      contacts?: { name?: string; email?: string } | null
      email_templates?: { subject?: string } | null
      email_sequences?: { name?: string } | null
    } | null
    const contact = emailLog?.contacts as { name?: string; email?: string } | null
    const template = emailLog?.email_templates as { subject?: string } | null
    const sequence = emailLog?.email_sequences as { name?: string } | null
    
    const contactName = contact?.name || contact?.email || 'Unknown'
    const subject = emailLog?.subject || template?.subject || 'No subject'
    const emailType = emailLog?.email_type === 'individual' ? 'Individual Email' : (sequence?.name || 'Unknown Sequence')

    let description = ''
    let type: ActivityType

    switch (event.event_type) {
      case 'sent':
        type = 'email_sent'
        description = `Email sent to ${contactName}: ${subject} (${emailType})`
        break
      case 'delivered':
        type = 'email_delivered'
        description = `Email delivered to ${contactName}: ${subject} (${emailType})`
        break
      case 'opened':
        type = 'email_opened'
        description = `Email opened by ${contactName}: ${subject} (${emailType})`
        break
      case 'clicked':
        type = 'email_clicked'
        description = `Email clicked by ${contactName}: ${subject} (${emailType})`
        break
      case 'bounced':
        type = 'email_bounced'
        description = `Email bounced for ${contactName}: ${subject} (${emailType})`
        break
      default:
        return
    }

    activities.push({
      id: event.id,
      type,
      timestamp: event.created_at,
      description,
      metadata: {
        contactName,
        subject,
        emailType
      }
    })
  })

  // Process contact additions
  contacts?.forEach(contact => {
    activities.push({
      id: contact.id,
      type: 'contact_added',
      timestamp: contact.created_at,
      description: `Contact added: ${contact.name || contact.email}`,
      metadata: {
        contactName: contact.name || contact.email,
        email: contact.email
      }
    })
  })

  // Process sequence creations
  sequences?.forEach(sequence => {
    activities.push({
      id: sequence.id,
      type: 'sequence_created',
      timestamp: sequence.created_at,
      description: `Sequence created: ${sequence.name}`,
      metadata: {
        sequenceName: sequence.name
      }
    })
  })

  // Process group creations
  groups?.forEach(group => {
    activities.push({
      id: group.id,
      type: 'group_created',
      timestamp: group.created_at,
      description: `Group created: ${group.name}`,
      metadata: {
        groupName: group.name
      }
    })
  })

  // Process email replies
  emailReplies?.forEach(reply => {
    const emailLog = reply.email_logs as {
      id?: string
      subject?: string
      contacts?: { name?: string; email?: string } | null
    } | null
    const contact = emailLog?.contacts as { name?: string; email?: string } | null
    const contactName = contact?.name || contact?.email || 'Unknown'
    const subject = emailLog?.subject || 'No subject'

    activities.push({
      id: reply.id,
      type: 'email_replied',
      timestamp: reply.received_at,
      description: `Email replied by ${contactName}: ${subject}`,
      metadata: {
        contactName,
        subject
      }
    })
  })

  // Sort all activities by timestamp (most recent first)
  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function formatActivityTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}
