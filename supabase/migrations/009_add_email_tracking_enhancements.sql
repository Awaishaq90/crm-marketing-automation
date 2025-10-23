-- Add email tracking enhancements
-- Migration 009: Add email tracking enhancements

-- Add missing timestamp columns to email_logs
ALTER TABLE email_logs
ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN bounced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN complained_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN open_count INTEGER DEFAULT 0,
ADD COLUMN click_count INTEGER DEFAULT 0,
ADD COLUMN last_opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_clicked_at TIMESTAMP WITH TIME ZONE;

-- Create email_events table for detailed event tracking
CREATE TABLE email_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email_log_id UUID REFERENCES email_logs(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained')),
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_email_events_email_log_id ON email_events(email_log_id);
CREATE INDEX idx_email_events_type ON email_events(event_type);
CREATE INDEX idx_email_events_created_at ON email_events(created_at);

-- Enable RLS on email_events
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_events
CREATE POLICY "Users can view all email_events" ON email_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert email_events" ON email_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update email_events" ON email_events FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete email_events" ON email_events FOR DELETE USING (auth.role() = 'authenticated');
