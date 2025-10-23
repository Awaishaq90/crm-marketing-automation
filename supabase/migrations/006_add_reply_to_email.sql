-- Add reply_to_email column to sender_emails table
ALTER TABLE sender_emails
ADD COLUMN reply_to_email VARCHAR(255);

-- Add index for performance
CREATE INDEX idx_sender_emails_reply_to ON sender_emails(reply_to_email);

-- Add comment to explain the column
COMMENT ON COLUMN sender_emails.reply_to_email IS 'Optional email address where replies will be sent instead of the sender email';
