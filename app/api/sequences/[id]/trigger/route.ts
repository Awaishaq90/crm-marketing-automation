import { createClient } from '@/lib/supabase/server'
import { EmailQueue } from '@/lib/email-queue'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contactIds } = await request.json()

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

    // Verify contacts exist
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, email')
      .in('id', contactIds)

    if (contactsError) {
      return NextResponse.json({ error: 'Failed to verify contacts' }, { status: 500 })
    }

    if (contacts.length !== contactIds.length) {
      return NextResponse.json({ error: 'Some contacts not found' }, { status: 400 })
    }

    // Check for existing active sequences
    const { data: existingSequences, error: existingError } = await supabase
      .from('contact_sequences')
      .select('contact_id')
      .eq('sequence_id', id)
      .in('contact_id', contactIds)
      .eq('status', 'active')

    if (existingError) {
      return NextResponse.json({ error: 'Failed to check existing sequences' }, { status: 500 })
    }

    const existingContactIds = existingSequences?.map(cs => cs.contact_id) || []
    const newContactIds = contactIds.filter(id => !existingContactIds.includes(id))

    if (newContactIds.length === 0) {
      return NextResponse.json({ 
        error: 'All selected contacts are already in this sequence',
        existing: existingContactIds.length
      }, { status: 400 })
    }

    // Add contacts to queue
    const emailQueue = new EmailQueue()
    const result = await emailQueue.addContactsToQueue(newContactIds, id)

    return NextResponse.json({
      success: true,
      message: `Successfully added ${result.count} contacts to sequence`,
      added: result.count,
      existing: existingContactIds.length
    })

  } catch (error) {
    console.error('Error triggering sequence:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
