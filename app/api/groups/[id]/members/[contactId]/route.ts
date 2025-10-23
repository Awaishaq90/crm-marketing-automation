import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id, contactId } = await params
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove contact from group
    const { error } = await supabase
      .from('contact_group_members')
      .delete()
      .eq('group_id', id)
      .eq('contact_id', contactId)

    if (error) {
      console.error('Error removing group member:', error)
      return NextResponse.json({ error: 'Failed to remove member from group' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in group member DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
