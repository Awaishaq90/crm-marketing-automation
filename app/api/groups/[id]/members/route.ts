import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
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

    // Fetch group members with contact details
    const { data: members, error } = await supabase
      .from('contact_group_members')
      .select(`
        id,
        added_at,
        contacts (
          id,
          name,
          email,
          phone,
          company,
          lead_status
        )
      `)
      .eq('group_id', id)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('Error fetching group members:', error)
      return NextResponse.json({ error: 'Failed to fetch group members' }, { status: 500 })
    }

    return NextResponse.json({ members: members || [] })
  } catch (error) {
    console.error('Error in group members GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
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

    // Check if group exists
    const { data: group } = await supabase
      .from('contact_groups')
      .select('id')
      .eq('id', id)
      .single()

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if contacts exist
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id')
      .in('id', contactIds)

    if (!contacts || contacts.length !== contactIds.length) {
      return NextResponse.json({ error: 'One or more contacts not found' }, { status: 400 })
    }

    // Prepare member data
    const membersToAdd = contactIds.map(contactId => ({
      group_id: id,
      contact_id: contactId
    }))

    // Add members to group (ignore conflicts for existing members)
    const { data, error } = await supabase
      .from('contact_group_members')
      .upsert(membersToAdd, { 
        onConflict: 'group_id,contact_id',
        ignoreDuplicates: true 
      })
      .select()

    if (error) {
      console.error('Error adding group members:', error)
      return NextResponse.json({ error: 'Failed to add members to group' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      added: data?.length || 0,
      message: `Added ${data?.length || 0} contacts to group` 
    })
  } catch (error) {
    console.error('Error in group members POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
