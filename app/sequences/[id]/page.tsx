import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SequenceDetailClient from '@/components/sequence-detail-client'

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

  // Fetch contact sequences with full contact details
  const { data: contactSequences } = await supabase
    .from('contact_sequences')
    .select(`
      id,
      status,
      current_step,
      started_at,
      last_sent_at,
      contacts!inner(
        id,
        name,
        email,
        company,
        lead_status
      )
    `)
    .eq('sequence_id', id)
    .order('started_at', { ascending: false })

  // Get email counts for each contact
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contactIds = contactSequences?.map(cs => (cs.contacts as any)?.id).filter(Boolean) || []
  const { data: emailCounts } = await supabase
    .from('email_logs')
    .select('contact_id')
    .eq('sequence_id', id)
    .in('contact_id', contactIds)

  const emailCountMap = emailCounts?.reduce((acc, log) => {
    acc[log.contact_id] = (acc[log.contact_id] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  // Combine contact data with progress
  const contactsWithProgress = contactSequences?.map(cs => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contact = (cs.contacts as any)
    return {
      id: cs.id,
      contact_id: contact?.id || '',
      name: contact?.name || '',
      email: contact?.email || '',
      company: contact?.company || null,
      lead_status: contact?.lead_status || '',
      status: cs.status,
      current_step: cs.current_step,
      started_at: cs.started_at,
      last_sent_at: cs.last_sent_at,
      emails_sent: emailCountMap[contact?.id || ''] || 0
    }
  }) || []

  // Calculate stats
  const stats = contactSequences?.reduce((acc, cs) => {
    acc[cs.status] = (acc[cs.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return (
    <SequenceDetailClient 
      sequence={sequence}
      templates={templates || []}
      contacts={contactsWithProgress}
      stats={stats}
      user={user}
    />
  )
}
