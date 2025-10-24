import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { EmailQueue } from '@/lib/email-queue'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Process email queue
    const emailQueue = new EmailQueue()
    const result = await emailQueue.processQueue()

    return NextResponse.json({
      success: true,
      processed: result.processed,
      message: result.message,
      errors: result.errors || []
    })

  } catch (error) {
    console.error('Error processing email queue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
