-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create contacts table
CREATE TABLE contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  lead_status VARCHAR(50) DEFAULT 'new' CHECK (lead_status IN ('new', 'qualified', 'disqualified', 'contacted', 'converted')),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_sequences table
CREATE TABLE email_sequences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  intervals INTEGER[] DEFAULT '{0,3,7,14}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_templates table
CREATE TABLE email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL CHECK (order_index >= 1 AND order_index <= 4),
  subject VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contact_sequences table
CREATE TABLE contact_sequences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'unsubscribed')),
  current_step INTEGER DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sent_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(contact_id, sequence_id)
);

-- Create email_logs table
CREATE TABLE email_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE CASCADE,
  resend_email_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contact_notes table
CREATE TABLE contact_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_queue table
CREATE TABLE email_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  priority INTEGER DEFAULT 2 CHECK (priority IN (1, 2, 3)),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_lead_status ON contacts(lead_status);
CREATE INDEX idx_email_queue_scheduled_at ON email_queue(scheduled_at);
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_priority ON email_queue(priority);
CREATE INDEX idx_contact_sequences_status ON contact_sequences(status);
CREATE INDEX idx_email_logs_contact_id ON email_logs(contact_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can view all contacts" ON contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert contacts" ON contacts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update contacts" ON contacts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete contacts" ON contacts FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all email_sequences" ON email_sequences FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert email_sequences" ON email_sequences FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update email_sequences" ON email_sequences FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete email_sequences" ON email_sequences FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all email_templates" ON email_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert email_templates" ON email_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update email_templates" ON email_templates FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete email_templates" ON email_templates FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all contact_sequences" ON contact_sequences FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert contact_sequences" ON contact_sequences FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update contact_sequences" ON contact_sequences FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete contact_sequences" ON contact_sequences FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all email_logs" ON email_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert email_logs" ON email_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update email_logs" ON email_logs FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all contact_notes" ON contact_notes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert contact_notes" ON contact_notes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update contact_notes" ON contact_notes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete contact_notes" ON contact_notes FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all email_queue" ON email_queue FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert email_queue" ON email_queue FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update email_queue" ON email_queue FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete email_queue" ON email_queue FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_notes_updated_at BEFORE UPDATE ON contact_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
