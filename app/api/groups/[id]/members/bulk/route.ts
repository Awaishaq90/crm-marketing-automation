import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get contact IDs from request body
    const body = await request.json()
    const { contactIds } = body

    // Validate input
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'Contact IDs array is required' }, { status: 400 })
    }

    // Remove multiple contacts from group
    const { error } = await supabase
      .from('contact_group_members')
      .delete()
      .eq('group_id', id)
      .in('contact_id', contactIds)

    if (error) {
      console.error('Error removing group members:', error)
      return NextResponse.json({ error: 'Failed to remove members from group' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      removed: contactIds.length,
      message: `Removed ${contactIds.length} contacts from group`
    })
  } catch (error) {
    console.error('Error in bulk group members DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
