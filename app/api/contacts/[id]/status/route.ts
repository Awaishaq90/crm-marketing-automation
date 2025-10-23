import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
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

    // Get the new status from request body
    const body = await request.json()
    const { lead_status } = body

    // Validate status
    const validStatuses = ['new', 'qualified', 'disqualified', 'contacted', 'converted']
    if (!lead_status || !validStatuses.includes(lead_status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: new, qualified, disqualified, contacted, converted' },
        { status: 400 }
      )
    }

    // Update contact status
    const { data, error } = await supabase
      .from('contacts')
      .update({ lead_status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating contact status:', error)
      return NextResponse.json({ error: 'Failed to update contact status' }, { status: 500 })
    }

    return NextResponse.json({ success: true, contact: data })
  } catch (error) {
    console.error('Error in status update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

