// App-wide constants - no hardcoded values
export const EMAIL_BATCH_SIZE = 100
export const MAX_RETRY_ATTEMPTS = 3
export const DEFAULT_EMAIL_INTERVALS = [0, 3, 7, 14] // days
export const LEAD_STATUSES = [
  'new',
  'qualified', 
  'disqualified',
  'contacted',
  'converted'
] as const

export const EMAIL_QUEUE_PRIORITIES = {
  HIGH: 1,    // New emails
  NORMAL: 2,  // Sequence emails
  LOW: 3      // Retry emails
} as const

export const EMAIL_STATUSES = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  OPENED: 'opened',
  CLICKED: 'clicked',
  REPLIED: 'replied',
  BOUNCED: 'bounced',
  FAILED: 'failed'
} as const

export const SEQUENCE_STATUSES = {
  ACTIVE: 'active',
  PAUSED: 'paused', 
  COMPLETED: 'completed',
  UNSUBSCRIBED: 'unsubscribed'
} as const
