# 📧 Resend Email Reply Setup - Step by Step Guide

This guide will walk you through setting up Resend to catch and forward email replies to your CRM system.

## 🎯 What We're Setting Up

When someone replies to `zara@interact.timetechnologiesllc.com`, you want to:
1. Receive that reply in your main email inbox
2. Track the reply in your CRM system
3. Automatically pause email sequences when someone replies

## 📋 Prerequisites

- Resend account (free tier available)
- Your domain `interact.timetechnologiesllc.com` 
- Access to your domain's DNS settings
- Your CRM system deployed and accessible

## 🚀 Step-by-Step Setup

### Step 1: Add Your Domain to Resend

1. **Log into Resend Dashboard**
   - Go to [resend.com](https://resend.com)
   - Sign in to your account

2. **Navigate to Domains**
   - Click on "Domains" in the left sidebar
   - Click "Add Domain"

3. **Add Your Domain**
   ```
   Domain Name: interact.timetechnologiesllc.com
   ```
   - Click "Add Domain"
   - Resend will generate DNS records for you

### Step 2: Configure DNS Records

1. **Go to Your Domain Provider**
   - Log into your domain registrar (GoDaddy, Namecheap, etc.)
   - Navigate to DNS management

2. **Add the Required DNS Records**
   
   **A. SPF Record (TXT)**
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:_spf.resend.com ~all
   TTL: 3600
   ```

   **B. DKIM Record (TXT)**
   ```
   Type: TXT
   Name: resend._domainkey
   Value: [Copy from Resend dashboard - will be provided]
   TTL: 3600
   ```

   **C. DMARC Record (TXT)**
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@interact.timetechnologiesllc.com
   TTL: 3600
   ```

   **D. MX Record (for receiving emails)**
   ```
   Type: MX
   Name: @
   Value: feedback-smtp.us-east-1.amazonses.com
   Priority: 10
   TTL: 3600
   ```

3. **Wait for DNS Propagation**
   - DNS changes can take 5-60 minutes
   - Use [whatsmydns.net](https://whatsmydns.net) to check propagation

### Step 3: Verify Domain in Resend

1. **Go Back to Resend Dashboard**
   - Navigate to "Domains"
   - Click on your domain `interact.timetechnologiesllc.com`

2. **Check Domain Status**
   - Wait for "Verified" status
   - All DNS records should show green checkmarks

3. **Test Domain Verification**
   - Click "Send Test Email" if available
   - Or proceed to next step

### Step 4: Set Up Email Forwarding

1. **Navigate to Email Forwarding**
   - In Resend dashboard, go to "Domains"
   - Click on your domain
   - Look for "Email Forwarding" or "Catch-all" settings

2. **Configure Catch-All Forwarding**
   ```
   From: *@interact.timetechnologiesllc.com
   To: your-main-email@gmail.com
   ```

3. **Alternative: Individual Forwarding Rules**
   If catch-all isn't available, set up individual rules:
   ```
   Rule 1: zara@interact.timetechnologiesllc.com → your-email@gmail.com
   Rule 2: sales@interact.timetechnologiesllc.com → your-email@gmail.com
   Rule 3: support@interact.timetechnologiesllc.com → your-email@gmail.com
   ```

### Step 5: Configure Webhook for CRM Integration

**Method A: Using Resend Webhooks (if email.received is available)**

1. **Go to Webhooks in Resend**
   - Navigate to "Webhooks" in the left sidebar
   - Click "Add Webhook"

2. **Set Up Webhook**
   ```
   Webhook URL: https://yourdomain.com/api/webhooks/email-replies
   Events: email.received
   Secret: [Generate a random secret key]
   ```

3. **Save Webhook Configuration**
   - Click "Save" or "Create Webhook"
   - Note down the webhook secret for later

**Method B: Alternative Approach (Recommended)**

Since `email.received` might not be available, we'll use email forwarding with a different approach:

1. **Set Up Email Forwarding to a Service**
   - Forward emails to a service like Zapier, Make.com, or a custom email parser
   - Or use a service like Mailgun, SendGrid, or Postmark for incoming emails

2. **Use a Third-Party Email Parser**
   - Services like Zapier Email Parser, Mailgun, or Postmark
   - These can parse incoming emails and send data to your webhook

3. **Simple Email Forwarding (Recommended for Now)**
   - Set up email forwarding to your main email
   - You'll receive all replies in your main inbox
   - Manually track replies in your CRM (or implement a simple solution)
   - This is the most reliable approach

4. **Gmail/Outlook Rules Approach**
   - Set up email forwarding to your main email
   - Create email rules to automatically forward replies to a special email
   - Use that special email to trigger webhook calls to your CRM

### Step 6: Update Your CRM Environment Variables

1. **Add to Your .env.local File**
   ```env
   # Add these new variables
   RESEND_WEBHOOK_SECRET=your_webhook_secret_here
   EMAIL_DOMAIN=interact.timetechnologiesllc.com
   ```

2. **Update Your Webhook Endpoint**
   - The webhook endpoint is already created at `/api/webhooks/email-replies`
   - Make sure your CRM is deployed and accessible

### Step 7: Test the Complete Setup

1. **Send a Test Email from Your CRM**
   - Go to a contact in your CRM
   - Send an individual email using `zara@interact.timetechnologiesllc.com`

2. **Reply to That Email**
   - Use a different email account
   - Reply to the email you just sent
   - The reply should go to `zara@interact.timetechnologiesllc.com`

3. **Check Your Main Email**
   - You should receive the reply in your main email inbox
   - The email should be forwarded from Resend

4. **Check Your CRM**
   - Go to the contact's profile
   - Look for the "Email Replies" section
   - The reply should appear there

## 🔧 Advanced Configuration

### Setting Up Multiple Sender Emails

1. **In Resend Dashboard**
   - Go to "Domains" → Your domain
   - Add additional email addresses:
     - `zara@interact.timetechnologiesllc.com`
     - `sales@interact.timetechnologiesllc.com`
     - `support@interact.timetechnologiesllc.com`

2. **Set Up Forwarding for Each**
   ```
   zara@interact.timetechnologiesllc.com → your-email@gmail.com
   sales@interact.timetechnologiesllc.com → your-email@gmail.com
   support@interact.timetechnologiesllc.com → your-email@gmail.com
   ```

### Custom Email Routing

If you want different emails to go to different people:

1. **Set Up Multiple Forwarding Rules**
   ```
   zara@interact.timetechnologiesllc.com → zara@yourcompany.com
   sales@interact.timetechnologiesllc.com → sales@yourcompany.com
   support@interact.timetechnologiesllc.com → support@yourcompany.com
   ```

2. **Configure in Your CRM**
   - Update sender email settings
   - Each sender can have different forwarding rules

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### Issue 1: Domain Not Verifying
**Symptoms:** Domain shows as "Pending" or "Failed"
**Solutions:**
- Check DNS propagation: [whatsmydns.net](https://whatsmydns.net)
- Verify all DNS records are correct
- Wait up to 24 hours for full propagation
- Contact your domain provider if issues persist

#### Issue 2: Emails Not Being Forwarded
**Symptoms:** Replies not reaching your main email
**Solutions:**
- Check forwarding rules in Resend
- Verify MX records are correct
- Test with a simple email first
- Check spam folder in your main email

#### Issue 3: Webhook Not Receiving Data
**Symptoms:** Replies not appearing in CRM
**Solutions:**
- Check webhook URL is accessible
- Verify webhook secret matches
- Check server logs for errors
- Test webhook with a simple POST request

#### Issue 4: Emails Going to Spam
**Symptoms:** Forwarded emails in spam folder
**Solutions:**
- Add `interact.timetechnologiesllc.com` to your contacts
- Configure spam filters
- Improve email authentication (SPF, DKIM, DMARC)
- Use a professional email service

### Testing Checklist

- [ ] Domain is verified in Resend
- [ ] All DNS records are correct
- [ ] MX records are pointing to Resend
- [ ] Forwarding rules are configured
- [ ] Webhook is set up and accessible
- [ ] Test email is sent successfully
- [ ] Reply is received in main email
- [ ] Reply is tracked in CRM
- [ ] Sequence is paused on reply

## 📊 Monitoring and Analytics

### In Resend Dashboard
- **Email Volume**: Track incoming emails
- **Delivery Status**: Monitor forwarding success
- **Webhook Logs**: Check webhook delivery
- **Domain Health**: Monitor authentication

### In Your CRM
- **Reply Tracking**: See all replies per contact
- **Engagement Metrics**: Track reply rates
- **Sequence Pausing**: Monitor automated pausing
- **Response Times**: Measure reply response times

## 🔒 Security Best Practices

1. **Webhook Security**
   - Use HTTPS for webhook URLs
   - Implement webhook signature verification
   - Use strong, random webhook secrets
   - Monitor webhook logs for suspicious activity

2. **Email Security**
   - Keep DNS records up to date
   - Monitor for domain spoofing
   - Use strong SPF, DKIM, DMARC policies
   - Regular security audits

3. **Data Privacy**
   - Encrypt sensitive email content
   - Implement access controls
   - Regular data backups
   - GDPR compliance considerations

## 📞 Support and Resources

### Resend Support
- **Documentation**: [resend.com/docs](https://resend.com/docs)
- **Support**: [resend.com/support](https://resend.com/support)
- **Status Page**: [status.resend.com](https://status.resend.com)

### Additional Resources
- **DNS Checker**: [whatsmydns.net](https://whatsmydns.net)
- **Email Testing**: [mail-tester.com](https://mail-tester.com)
- **SPF Record Generator**: [spf-record.com](https://spf-record.com)

---

## 🎉 Success!

Once everything is set up, you'll have:
- ✅ Professional email sending from your domain
- ✅ Automatic reply forwarding to your main email
- ✅ Reply tracking in your CRM system
- ✅ Automatic sequence pausing on replies
- ✅ Complete email conversation history

**Your email workflow is now fully automated!** 🚀
