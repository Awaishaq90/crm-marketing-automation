import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all groups with member count
    const { data: groups, error } = await supabase
      .from('contact_groups')
      .select(`
        *,
        member_count:contact_group_members(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching groups:', error)
      return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
    }

    // Transform the data to include actual member count
    const groupsWithCount = groups?.map(group => ({
      ...group,
      member_count: group.member_count?.[0]?.count || 0
    })) || []

    return NextResponse.json({ groups: groupsWithCount })
  } catch (error) {
    console.error('Error in groups GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the group data from request body
    const body = await request.json()
    const { name, description, color } = body

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // Validate color format if provided
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json({ error: 'Invalid color format. Use hex format like #3B82F6' }, { status: 400 })
    }

    // Check if group name already exists
    const { data: existingGroup } = await supabase
      .from('contact_groups')
      .select('id')
      .eq('name', name.trim())
      .single()

    if (existingGroup) {
      return NextResponse.json({ error: 'Group name already exists' }, { status: 400 })
    }

    // Create new group
    const { data, error } = await supabase
      .from('contact_groups')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating group:', error)
      return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
    }

    return NextResponse.json({ success: true, group: data })
  } catch (error) {
    console.error('Error in groups POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
