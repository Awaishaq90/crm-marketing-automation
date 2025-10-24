import { createClient } from '@/lib/supabase/server'
import { EmailQueue } from '@/lib/email-queue'
import { NextRequest, NextResponse } from 'next/server'

interface ContactData {
  id: string
  name: string | null
  email: string
  company: string | null
  lead_status: string
}


interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET: List all contacts in sequence with details
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all contacts in this sequence with progress details
    const { data: contacts, error } = await supabase
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

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    // Get email counts for each contact
    const contactIds = contacts?.map(cs => (cs.contacts as ContactData[])?.find(c => c)?.id).filter(Boolean) || []
    const { data: emailCounts } = await supabase
      .from('email_logs')
      .select('contact_id')
      .eq('sequence_id', id)
      .in('contact_id', contactIds)

    const emailCountMap = emailCounts?.reduce((acc, log) => {
      acc[log.contact_id] = (acc[log.contact_id] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Combine data
    const contactsWithProgress = contacts?.map(cs => {
      const contact = (cs.contacts as ContactData[])?.find(c => c)
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

    return NextResponse.json({ contacts: contactsWithProgress })

  } catch (error) {
    console.error('Error fetching sequence contacts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Add contacts to sequence
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contactIds, startImmediately = true } = await request.json()

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'Contact IDs are required' }, { status: 400 })
    }

    // Verify sequence exists
    const { data: sequence, error: sequenceError } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('id', id)
      .single()

    if (sequenceError || !sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    // Check for existing contacts in this sequence
    const { data: existingContacts, error: existingError } = await supabase
      .from('contact_sequences')
      .select('contact_id')
      .eq('sequence_id', id)
      .in('contact_id', contactIds)
      .in('status', ['active', 'paused'])

    if (existingError) {
      return NextResponse.json({ error: 'Failed to check existing contacts' }, { status: 500 })
    }

    const existingContactIds = existingContacts?.map(ec => ec.contact_id) || []
    const newContactIds = contactIds.filter(id => !existingContactIds.includes(id))

    if (newContactIds.length === 0) {
      return NextResponse.json({ 
        error: 'All selected contacts are already in this sequence',
        existing: existingContactIds.length
      }, { status: 400 })
    }

    // Create contact sequences
    const contactSequences = newContactIds.map(contactId => ({
      contact_id: contactId,
      sequence_id: id,
      status: startImmediately ? 'active' : 'paused',
      current_step: 1,
      started_at: new Date().toISOString()
    }))

    const { error: insertError } = await supabase
      .from('contact_sequences')
      .insert(contactSequences)

    if (insertError) {
      return NextResponse.json({ error: 'Failed to add contacts to sequence' }, { status: 500 })
    }

    // If starting immediately, add first emails to queue
    if (startImmediately) {
      const emailQueue = new EmailQueue()
      await emailQueue.addContactsToQueue(newContactIds, id)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${newContactIds.length} contacts to sequence`,
      added: newContactIds.length,
      existing: existingContactIds.length,
      started: startImmediately
    })

  } catch (error) {
    console.error('Error adding contacts to sequence:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Update contact status (pause/resume)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contactSequenceIds, status } = await request.json()

    if (!contactSequenceIds || !Array.isArray(contactSequenceIds) || contactSequenceIds.length === 0) {
      return NextResponse.json({ error: 'Contact sequence IDs are required' }, { status: 400 })
    }

    if (!['active', 'paused'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be "active" or "paused"' }, { status: 400 })
    }

    const { error } = await supabase
      .from('contact_sequences')
      .update({ status })
      .in('id', contactSequenceIds)
      .eq('sequence_id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update contact status' }, { status: 500 })
    }

    // If resuming (status = 'active'), add first emails to queue for contacts that haven't started
    if (status === 'active') {
      const { data: pausedContacts } = await supabase
        .from('contact_sequences')
        .select('contact_id')
        .eq('sequence_id', id)
        .in('id', contactSequenceIds)
        .eq('current_step', 1)

      if (pausedContacts && pausedContacts.length > 0) {
        const contactIds = pausedContacts.map(pc => pc.contact_id)
        const emailQueue = new EmailQueue()
        await emailQueue.addContactsToQueue(contactIds, id)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${status === 'active' ? 'resumed' : 'paused'} ${contactSequenceIds.length} contacts`
    })

  } catch (error) {
    console.error('Error updating contact status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Remove contacts from sequence
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contactSequenceIds = searchParams.get('ids')?.split(',') || []

    if (contactSequenceIds.length === 0) {
      return NextResponse.json({ error: 'Contact sequence IDs are required' }, { status: 400 })
    }

    // Remove from contact_sequences
    const { error: deleteError } = await supabase
      .from('contact_sequences')
      .delete()
      .in('id', contactSequenceIds)
      .eq('sequence_id', id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to remove contacts from sequence' }, { status: 500 })
    }

    // Remove pending emails from queue
    const { data: contactSequences } = await supabase
      .from('contact_sequences')
      .select('contact_id')
      .in('id', contactSequenceIds)

    if (contactSequences && contactSequences.length > 0) {
      const contactIds = contactSequences.map(cs => cs.contact_id)
      const emailQueue = new EmailQueue()
      await emailQueue.stopSequenceForContact(contactIds[0], id) // This will remove all pending emails for these contacts
    }

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${contactSequenceIds.length} contacts from sequence`
    })

  } catch (error) {
    console.error('Error removing contacts from sequence:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
