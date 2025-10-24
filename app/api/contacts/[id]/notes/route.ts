import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// POST: Add a note to a contact
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { note } = await request.json()

    if (!note || note.trim().length === 0) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
    }

    // Verify contact exists
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', id)
      .single()

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Create the note
    const { data: newNote, error: insertError } = await supabase
      .from('contact_notes')
      .insert({
        contact_id: id,
        note: note.trim(),
        created_by: user.id
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating note:', insertError)
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      note: newNote,
      message: 'Note added successfully' 
    })

  } catch (error) {
    console.error('Error adding note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Get all notes for a contact
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all notes for this contact
    const { data: notes, error } = await supabase
      .from('contact_notes')
      .select(`
        *,
        created_by_user:created_by
      `)
      .eq('contact_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    return NextResponse.json({ notes })

  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
