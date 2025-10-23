-- Safe migration for email tracking enhancements
-- This migration checks for existing columns before adding them

-- Add missing timestamp columns to email_logs (only if they don't exist)
DO $$ 
BEGIN
    -- Add delivered_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_logs' AND column_name = 'delivered_at') THEN
        ALTER TABLE email_logs ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add bounced_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_logs' AND column_name = 'bounced_at') THEN
        ALTER TABLE email_logs ADD COLUMN bounced_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add complained_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_logs' AND column_name = 'complained_at') THEN
        ALTER TABLE email_logs ADD COLUMN complained_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add open_count if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_logs' AND column_name = 'open_count') THEN
        ALTER TABLE email_logs ADD COLUMN open_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add click_count if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_logs' AND column_name = 'click_count') THEN
        ALTER TABLE email_logs ADD COLUMN click_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add last_opened_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_logs' AND column_name = 'last_opened_at') THEN
        ALTER TABLE email_logs ADD COLUMN last_opened_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add last_clicked_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_logs' AND column_name = 'last_clicked_at') THEN
        ALTER TABLE email_logs ADD COLUMN last_clicked_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create email_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email_log_id UUID REFERENCES email_logs(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained')),
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_email_events_email_log_id ON email_events(email_log_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON email_events(created_at);

-- Enable RLS on email_events (only if not already enabled)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'email_events' AND relrowsecurity = true) THEN
        ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies for email_events (only if they don't exist)
DO $$ 
BEGIN
    -- Check if policies exist before creating them
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_events' AND policyname = 'Users can view all email_events') THEN
        CREATE POLICY "Users can view all email_events" ON email_events FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_events' AND policyname = 'Users can insert email_events') THEN
        CREATE POLICY "Users can insert email_events" ON email_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_events' AND policyname = 'Users can update email_events') THEN
        CREATE POLICY "Users can update email_events" ON email_events FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_events' AND policyname = 'Users can delete email_events') THEN
        CREATE POLICY "Users can delete email_events" ON email_events FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;
