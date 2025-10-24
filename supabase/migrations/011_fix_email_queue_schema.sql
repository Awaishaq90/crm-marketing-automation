-- Add missing columns to email_queue table
ALTER TABLE email_queue
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add trigger for updated_at on email_queue
CREATE TRIGGER update_email_queue_updated_at 
  BEFORE UPDATE ON email_queue 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure retry_count has proper default (it should already exist from initial schema)
-- This is just to be safe in case it was missing
ALTER TABLE email_queue 
ALTER COLUMN retry_count SET DEFAULT 0;
