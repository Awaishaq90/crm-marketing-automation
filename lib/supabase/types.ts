import { Database } from '@/lib/types/database'

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific table types
export type Contact = Tables<'contacts'>
export type EmailSequence = Tables<'email_sequences'>
export type EmailTemplate = Tables<'email_templates'>
export type ContactSequence = Tables<'contact_sequences'>
export type EmailLog = Tables<'email_logs'>
export type ContactNote = Tables<'contact_notes'>
export type EmailQueue = Tables<'email_queue'>

// Insert types
export type ContactInsert = Database['public']['Tables']['contacts']['Insert']
export type EmailSequenceInsert = Database['public']['Tables']['email_sequences']['Insert']
export type EmailTemplateInsert = Database['public']['Tables']['email_templates']['Insert']
export type ContactSequenceInsert = Database['public']['Tables']['contact_sequences']['Insert']
export type EmailLogInsert = Database['public']['Tables']['email_logs']['Insert']
export type ContactNoteInsert = Database['public']['Tables']['contact_notes']['Insert']
export type EmailQueueInsert = Database['public']['Tables']['email_queue']['Insert']

// Update types
export type ContactUpdate = Database['public']['Tables']['contacts']['Update']
export type EmailSequenceUpdate = Database['public']['Tables']['email_sequences']['Update']
export type EmailTemplateUpdate = Database['public']['Tables']['email_templates']['Update']
export type ContactSequenceUpdate = Database['public']['Tables']['contact_sequences']['Update']
export type EmailLogUpdate = Database['public']['Tables']['email_logs']['Update']
export type ContactNoteUpdate = Database['public']['Tables']['contact_notes']['Update']
export type EmailQueueUpdate = Database['public']['Tables']['email_queue']['Update']
