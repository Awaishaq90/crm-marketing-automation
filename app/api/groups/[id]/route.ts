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

    // Fetch single group with member count
    const { data: group, error } = await supabase
      .from('contact_groups')
      .select(`
        *,
        member_count:contact_group_members(count)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching group:', error)
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Transform the data to include actual member count
    const groupWithCount = {
      ...group,
      member_count: group.member_count?.[0]?.count || 0
    }

    return NextResponse.json({ group: groupWithCount })
  } catch (error) {
    console.error('Error in group GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    // Get the update data from request body
    const body = await request.json()
    const { name, description, color } = body

    // Validate required fields
    if (name !== undefined && (!name || name.trim() === '')) {
      return NextResponse.json({ error: 'Group name cannot be empty' }, { status: 400 })
    }

    // Validate color format if provided
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json({ error: 'Invalid color format. Use hex format like #3B82F6' }, { status: 400 })
    }

    // Check if group name already exists (if name is being updated)
    if (name) {
      const { data: existingGroup } = await supabase
        .from('contact_groups')
        .select('id')
        .eq('name', name.trim())
        .neq('id', id)
        .single()

      if (existingGroup) {
        return NextResponse.json({ error: 'Group name already exists' }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: {
      name?: string;
      description?: string;
      color?: string;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (color !== undefined) updateData.color = color

    // Update group
    const { data, error } = await supabase
      .from('contact_groups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating group:', error)
      return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
    }

    return NextResponse.json({ success: true, group: data })
  } catch (error) {
    console.error('Error in group PATCH API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    // Delete group (cascade will handle group members)
    const { error } = await supabase
      .from('contact_groups')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting group:', error)
      return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in group DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
