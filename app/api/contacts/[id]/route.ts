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

    // Get the update data from request body
    const body = await request.json()
    const { 
      name, 
      email, 
      phone, 
      company, 
      lead_status, 
      tags, 
      facebook_url, 
      instagram_url, 
      linkedin_url, 
      website_url, 
      address 
    } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate lead_status if provided
    if (lead_status) {
      const validStatuses = ['new', 'qualified', 'disqualified', 'contacted', 'converted']
      if (!validStatuses.includes(lead_status)) {
        return NextResponse.json({ 
          error: 'Invalid lead status. Must be one of: new, qualified, disqualified, contacted, converted' 
        }, { status: 400 })
      }
    }

    // Check if email is already taken by another contact
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', email)
      .neq('id', id)
      .single()

    if (existingContact) {
      return NextResponse.json({ 
        error: 'Email is already taken by another contact' 
      }, { status: 400 })
    }

    // Prepare update data
    const updateData: {
      name: string | null;
      email: string;
      phone: string | null;
      company: string | null;
      lead_status: string;
      tags: string[] | null;
      facebook_url: string | null;
      instagram_url: string | null;
      linkedin_url: string | null;
      website_url: string | null;
      address: string | null;
      updated_at: string;
    } = {
      name: name || null,
      email,
      phone: phone || null,
      company: company || null,
      lead_status: lead_status || 'new',
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((tag: string) => tag.trim())) : null,
      facebook_url: facebook_url || null,
      instagram_url: instagram_url || null,
      linkedin_url: linkedin_url || null,
      website_url: website_url || null,
      address: address || null,
      updated_at: new Date().toISOString()
    }

    // Update contact
    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating contact:', error)
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
    }

    return NextResponse.json({ success: true, contact: data })
  } catch (error) {
    console.error('Error in contact update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
