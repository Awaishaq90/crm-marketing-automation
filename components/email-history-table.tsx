'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface EmailLog {
  id: string
  subject: string | null
  body_html: string | null
  body_text: string | null
  status: string
  sent_at: string | null
  email_type: string
  email_sequences?: { name: string } | null
  email_templates?: { subject: string } | null
}

interface EmailHistoryTableProps {
  emailLogs: EmailLog[]
}

export default function EmailHistoryTable({ emailLogs }: EmailHistoryTableProps) {
  const [viewingEmail, setViewingEmail] = useState<EmailLog | null>(null)

  const getEmailStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'delivered':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'opened':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'clicked':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'bounced':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Sequence</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emailLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium text-foreground">
                {log.subject || log.email_templates?.subject || 'No subject'}
              </TableCell>
              <TableCell className="text-foreground">
                {log.email_type === 'individual' 
                  ? 'Individual Email' 
                  : (log.email_sequences?.name || 'Unknown')
                }
              </TableCell>
              <TableCell>
                <Badge className={`${getEmailStatusColor(log.status)} border font-medium`}>
                  {log.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {log.sent_at 
                  ? formatDate(log.sent_at)
                  : 'Not sent'
                }
              </TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setViewingEmail(log)}
                  className="hover:bg-primary/10"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {viewingEmail && (
        <Dialog open={!!viewingEmail} onOpenChange={() => setViewingEmail(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewingEmail.subject || 'No subject'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2 font-semibold">HTML Preview:</p>
                <div 
                  className="border rounded-md p-4 bg-white prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: viewingEmail.body_html || '<p>No content</p>' }}
                />
              </div>
              {viewingEmail.body_text && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2 font-semibold">Plain Text Version:</p>
                  <pre className="border rounded-md p-4 bg-gray-50 whitespace-pre-wrap text-sm font-sans">
                    {viewingEmail.body_text}
                  </pre>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Status:</span> {viewingEmail.status}
                  {viewingEmail.sent_at && (
                    <span className="ml-4">
                      <span className="font-medium">Sent:</span> {formatDate(viewingEmail.sent_at)}
                    </span>
                  )}
                </div>
                <Button onClick={() => setViewingEmail(null)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
