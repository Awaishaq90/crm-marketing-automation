-- Add sender_email field to email_sequences table
ALTER TABLE email_sequences
ADD COLUMN sender_email VARCHAR(255);

-- Add sender_email field to email_logs table for individual emails
ALTER TABLE email_logs
ADD COLUMN sender_email VARCHAR(255);

-- Update email_queue to include sender_email
ALTER TABLE email_queue
ADD COLUMN sender_email VARCHAR(255);
