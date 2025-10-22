-- Create sender_emails table for managing email senders
CREATE TABLE sender_emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_sender_emails_active ON sender_emails(active);
CREATE INDEX idx_sender_emails_default ON sender_emails(is_default);

-- Enable RLS
ALTER TABLE sender_emails ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all sender_emails" ON sender_emails FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert sender_emails" ON sender_emails FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update sender_emails" ON sender_emails FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete sender_emails" ON sender_emails FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE TRIGGER update_sender_emails_updated_at 
  BEFORE UPDATE ON sender_emails 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default sender email
INSERT INTO sender_emails (email, name, is_default, active) 
VALUES ('outreach@yourdomain.com', 'CRM Outreach', true, true);
