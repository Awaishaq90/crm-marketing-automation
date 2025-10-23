-- Create email_replies table to store incoming email replies
CREATE TABLE email_replies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email_log_id UUID REFERENCES email_logs(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  reply_from VARCHAR(255) NOT NULL,
  reply_to VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  body_text TEXT,
  body_html TEXT,
  message_id VARCHAR(255),
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_email_replies_contact_id ON email_replies(contact_id);
CREATE INDEX idx_email_replies_email_log_id ON email_replies(email_log_id);
CREATE INDEX idx_email_replies_received_at ON email_replies(received_at);

-- Enable RLS
ALTER TABLE email_replies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all email_replies" ON email_replies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert email_replies" ON email_replies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update email_replies" ON email_replies FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete email_replies" ON email_replies FOR DELETE USING (auth.role() = 'authenticated');
