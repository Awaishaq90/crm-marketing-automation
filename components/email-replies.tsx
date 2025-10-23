'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, Reply, Clock, User } from 'lucide-react'

interface EmailReply {
  id: string
  reply_from: string
  reply_to: string
  subject: string
  body_text: string
  body_html: string
  received_at: string
  email_logs?: {
    subject: string
    sent_at: string
  }
}

interface EmailRepliesProps {
  contactId: string
}

export default function EmailReplies({ contactId }: EmailRepliesProps) {
  const [replies, setReplies] = useState<EmailReply[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedReply, setExpandedReply] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadReplies = async () => {
      try {
        const { data } = await supabase
          .from('email_replies')
          .select(`
            *,
            email_logs(subject, sent_at)
          `)
          .eq('contact_id', contactId)
          .order('received_at', { ascending: false })

        setReplies(data || [])
      } catch (error) {
        console.error('Error loading replies:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadReplies()
  }, [contactId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getReplyPreview = (body: string) => {
    return body.length > 100 ? body.substring(0, 100) + '...' : body
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Reply className="w-5 h-5 mr-2" />
            Email Replies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading replies...</div>
        </CardContent>
      </Card>
    )
  }

  if (replies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Reply className="w-5 h-5 mr-2" />
            Email Replies
          </CardTitle>
          <CardDescription>
            Replies to emails sent to this contact will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No replies yet</p>
            <p className="text-sm">When this contact replies to your emails, they&apos;ll appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Reply className="w-5 h-5 mr-2" />
          Email Replies ({replies.length})
        </CardTitle>
        <CardDescription>
          Replies received from this contact
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {replies.map((reply) => (
            <div key={reply.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{reply.reply_from}</span>
                  <Badge variant="secondary">Reply</Badge>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(reply.received_at)}</span>
                </div>
              </div>
              
              <div className="mb-2">
                <p className="font-medium text-sm text-gray-700">
                  Re: {reply.email_logs?.subject || 'Email'}
                </p>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-600">
                  {expandedReply === reply.id 
                    ? reply.body_text 
                    : getReplyPreview(reply.body_text)
                  }
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedReply(
                    expandedReply === reply.id ? null : reply.id
                  )}
                >
                  {expandedReply === reply.id ? 'Show Less' : 'Show More'}
                </Button>
                
                <div className="text-xs text-gray-500">
                  Reply to: {reply.reply_to}
                </div>
              </div>

              {expandedReply === reply.id && (
                <div className="mt-4 p-3 bg-gray-50 rounded border">
                  <div className="text-xs text-gray-500 mb-2">Full Reply Content:</div>
                  <div className="text-sm whitespace-pre-wrap">
                    {reply.body_text}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
