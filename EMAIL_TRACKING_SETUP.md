# Email Open Rate Tracking Setup

## Overview

This document explains how to set up and test email open rate tracking using Resend webhooks.

## Prerequisites

- Resend account with API key configured
- Domain verified in Resend
- Webhook endpoint deployed and accessible

## Webhook Configuration

### 1. Configure Resend Webhooks

**IMPORTANT: Webhooks must be configured in Resend dashboard for tracking to work**

1. **Go to Resend Dashboard**
   - Navigate to https://resend.com/webhooks
   - Click "Create Webhook" or "Add Webhook"

2. **Configure Webhook Settings**
   ```
   Webhook URL: https://yourdomain.com/api/webhooks/resend
   Events to subscribe:
   - email.sent
   - email.delivered
   - email.opened
   - email.clicked
   - email.bounced
   - email.complained
   ```

3. **Webhook Signature**
   - Resend will provide a webhook signing secret
   - Add it to your `.env` file as `RESEND_WEBHOOK_SECRET`
   - The code already validates signatures using `EmailService.verifyWebhookSignature()`

4. **Test the Webhook**
   - Resend provides a "Test" button to send sample events
   - Or send a real test email and check your database for updates

**Note:** Without webhooks configured, open/click tracking will NOT work. The database will record emails as "sent" but never update to "opened" or "clicked".

## Database Schema

The tracking system uses these new database columns:

### email_logs table additions:
- `delivered_at` - When email was delivered
- `bounced_at` - When email bounced
- `complained_at` - When spam complaint received
- `open_count` - Number of times email was opened
- `click_count` - Number of times email was clicked
- `last_opened_at` - Timestamp of most recent open
- `last_clicked_at` - Timestamp of most recent click

### email_events table:
- Tracks every individual event (sent, delivered, opened, clicked, bounced, complained)
- Provides detailed audit trail for analysis

## Testing the Implementation

### 1. Send Test Email

1. Go to your CRM
2. Navigate to a contact
3. Send an individual email
4. Check the database for the email_logs entry

### 2. Test Open Tracking

1. Open the email in your email client
2. Check that `opened_at` and `open_count` are updated
3. Open the email multiple times - `open_count` should increment
4. Check `email_events` table for individual open events

### 3. Test Click Tracking

1. Click any link in the email
2. Check that `clicked_at` and `click_count` are updated
3. Click multiple links - `click_count` should increment
4. Check `email_events` table for individual click events

### 4. Verify Analytics

1. Go to sequence analytics page
2. Check that click rate is displayed prominently
3. Check that open rate shows total opens
4. Verify dashboard shows click rate as primary metric

## Troubleshooting

### Webhooks Not Working

1. **Check webhook URL**: Ensure it's accessible from the internet
2. **Check webhook signature**: Verify `RESEND_WEBHOOK_SECRET` is set correctly
3. **Check logs**: Look for webhook processing errors in your application logs
4. **Test webhook**: Use Resend's test feature to send sample events

### Database Not Updating

1. **Check webhook configuration**: Ensure all events are subscribed
2. **Check database connection**: Verify Supabase connection is working
3. **Check migration**: Ensure migration 009 has been applied
4. **Check email_logs**: Verify emails are being logged with `resend_email_id`

### Analytics Not Showing

1. **Check data**: Ensure emails have been sent and tracked
2. **Check queries**: Verify analytics queries are using correct fields
3. **Check permissions**: Ensure user has access to email_logs data

## Key Features

### Multiple Opens/Clicks Tracking
- Tracks total number of opens and clicks per email
- Preserves first open/click timestamps
- Updates last open/click timestamps

### Status Priority
- Email status follows hierarchy: replied > clicked > opened > delivered > sent
- Click automatically marks email as opened
- Status only moves forward, never backward

### Event History
- Every webhook event is logged in `email_events` table
- Provides detailed audit trail for analysis
- Includes raw webhook data for debugging

### Analytics Enhancement
- Click rate displayed as primary metric
- Open rate shown as secondary metric
- Total opens/clicks displayed in analytics
- Dashboard prioritizes click rate over open rate

## Migration

Run the database migration to add the new tracking columns:

```bash
# Apply migration 009
supabase db push
```

This will add the new columns to `email_logs` and create the `email_events` table.
