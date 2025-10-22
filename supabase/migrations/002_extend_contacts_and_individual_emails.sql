-- Add new fields to contacts table
ALTER TABLE contacts
ADD COLUMN facebook_url VARCHAR(255),
ADD COLUMN instagram_url VARCHAR(255),
ADD COLUMN linkedin_url VARCHAR(255),
ADD COLUMN website_url VARCHAR(255),
ADD COLUMN address TEXT;

-- Update email_logs to support individual emails (nullable sequence_id and template_id)
ALTER TABLE email_logs
ALTER COLUMN sequence_id DROP NOT NULL,
ALTER COLUMN template_id DROP NOT NULL;

-- Add column to distinguish individual vs sequence emails
ALTER TABLE email_logs
ADD COLUMN email_type VARCHAR(20) DEFAULT 'sequence' CHECK (email_type IN ('sequence', 'individual'));

-- Add columns to store individual email content
ALTER TABLE email_logs
ADD COLUMN subject VARCHAR(255),
ADD COLUMN body_html TEXT,
ADD COLUMN body_text TEXT;
