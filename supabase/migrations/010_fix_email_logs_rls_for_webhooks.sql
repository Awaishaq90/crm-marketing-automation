-- Fix RLS policies for email_logs to allow webhook access
-- Webhooks need to be able to read and update email_logs without authentication

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "email_logs_select_policy" ON email_logs;
DROP POLICY IF EXISTS "email_logs_update_policy" ON email_logs;

-- Create policy to allow SELECT for service role and authenticated users
CREATE POLICY "email_logs_select_authenticated" ON email_logs
  FOR SELECT
  USING (
    auth.role() = 'authenticated' OR 
    auth.role() = 'service_role' OR
    auth.role() = 'anon'
  );

-- Create policy to allow UPDATE for service role and authenticated users
CREATE POLICY "email_logs_update_authenticated" ON email_logs
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' OR 
    auth.role() = 'service_role' OR
    auth.role() = 'anon'
  );

-- Create policy to allow INSERT for authenticated users
CREATE POLICY "email_logs_insert_authenticated" ON email_logs
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' OR 
    auth.role() = 'service_role'
  );

