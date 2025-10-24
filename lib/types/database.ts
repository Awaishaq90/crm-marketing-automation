export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          email: string
          name: string | null
          phone: string | null
          company: string | null
          lead_status: 'new' | 'qualified' | 'disqualified' | 'contacted' | 'converted'
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          phone?: string | null
          company?: string | null
          lead_status?: 'new' | 'qualified' | 'disqualified' | 'contacted' | 'converted'
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          phone?: string | null
          company?: string | null
          lead_status?: 'new' | 'qualified' | 'disqualified' | 'contacted' | 'converted'
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      email_sequences: {
        Row: {
          id: string
          name: string
          description: string | null
          intervals: number[]
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          intervals?: number[]
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          intervals?: number[]
          active?: boolean
          created_at?: string
        }
      }
      email_templates: {
        Row: {
          id: string
          sequence_id: string
          order_index: number
          subject: string
          body_html: string
          body_text: string
          created_at: string
        }
        Insert: {
          id?: string
          sequence_id: string
          order_index: number
          subject: string
          body_html: string
          body_text: string
          created_at?: string
        }
        Update: {
          id?: string
          sequence_id?: string
          order_index?: number
          subject?: string
          body_html?: string
          body_text?: string
          created_at?: string
        }
      }
      contact_sequences: {
        Row: {
          id: string
          contact_id: string
          sequence_id: string
          status: 'active' | 'paused' | 'completed' | 'unsubscribed'
          current_step: number
          started_at: string
          last_sent_at: string | null
        }
        Insert: {
          id?: string
          contact_id: string
          sequence_id: string
          status?: 'active' | 'paused' | 'completed' | 'unsubscribed'
          current_step?: number
          started_at?: string
          last_sent_at?: string | null
        }
        Update: {
          id?: string
          contact_id?: string
          sequence_id?: string
          status?: 'active' | 'paused' | 'completed' | 'unsubscribed'
          current_step?: number
          started_at?: string
          last_sent_at?: string | null
        }
      }
      email_logs: {
        Row: {
          id: string
          contact_id: string
          sequence_id: string
          template_id: string
          resend_email_id: string | null
          status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed'
          sent_at: string | null
          opened_at: string | null
          clicked_at: string | null
          replied_at: string | null
          unsubscribed_at: string | null
          delivered_at: string | null
          bounced_at: string | null
          complained_at: string | null
          open_count: number
          click_count: number
          last_opened_at: string | null
          last_clicked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          sequence_id: string
          template_id: string
          resend_email_id?: string | null
          status?: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed'
          sent_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          replied_at?: string | null
          unsubscribed_at?: string | null
          delivered_at?: string | null
          bounced_at?: string | null
          complained_at?: string | null
          open_count?: number
          click_count?: number
          last_opened_at?: string | null
          last_clicked_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          sequence_id?: string
          template_id?: string
          resend_email_id?: string | null
          status?: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed'
          sent_at?: string | null
          opened_at?: string | null
          clicked_at?: string | null
          replied_at?: string | null
          unsubscribed_at?: string | null
          delivered_at?: string | null
          bounced_at?: string | null
          complained_at?: string | null
          open_count?: number
          click_count?: number
          last_opened_at?: string | null
          last_clicked_at?: string | null
          created_at?: string
        }
      }
      contact_notes: {
        Row: {
          id: string
          contact_id: string
          note: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          note: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          note?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      email_queue: {
        Row: {
          id: string
          contact_id: string
          sequence_id: string
          template_id: string
          scheduled_at: string
          priority: number
          status: 'pending' | 'sent' | 'failed'
          retry_count: number
          sender_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          sequence_id: string
          template_id: string
          scheduled_at: string
          priority?: number
          status?: 'pending' | 'sent' | 'failed'
          retry_count?: number
          sender_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          sequence_id?: string
          template_id?: string
          scheduled_at?: string
          priority?: number
          status?: 'pending' | 'sent' | 'failed'
          retry_count?: number
          sender_email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contact_groups: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      email_events: {
        Row: {
          id: string
          email_log_id: string
          event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained'
          event_data: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          email_log_id: string
          event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained'
          event_data?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          email_log_id?: string
          event_type?: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained'
          event_data?: Record<string, unknown>
          created_at?: string
        }
      }
      contact_group_members: {
        Row: {
          id: string
          group_id: string
          contact_id: string
          added_at: string
        }
        Insert: {
          id?: string
          group_id: string
          contact_id: string
          added_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          contact_id?: string
          added_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
