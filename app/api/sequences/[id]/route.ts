import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Delete in order to respect foreign key constraints
    // 1. Delete pending emails from queue for this sequence
    await supabase
      .from('email_queue')
      .delete()
      .eq('sequence_id', id)

    // 2. Delete contact sequences
    await supabase
      .from('contact_sequences')
      .delete()
      .eq('sequence_id', id)

    // 3. Delete email templates
    await supabase
      .from('email_templates')
      .delete()
      .eq('sequence_id', id)

    // 4. Delete the sequence itself
    const { error: deleteError } = await supabase
      .from('email_sequences')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete sequence' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Sequence deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting sequence:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
