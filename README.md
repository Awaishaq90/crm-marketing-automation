# CRM Marketing Automation

A lean CRM system with marketing automation built with Next.js 15, Supabase, and Resend.

## Features

- **Contact Management**: Add, edit, delete contacts with lead status tracking and notes
- **CSV Import**: Bulk import contacts from CSV files
- **Email Sequences**: Create 4-email automation sequences with customizable intervals
- **Marketing Automation**: Manual trigger system with email queue and rate limiting
- **Analytics Dashboard**: Track open rates, click rates, and sequence performance
- **Unsubscribe Management**: Personalized unsubscribe links with automatic sequence stopping
- **Authentication**: Secure login with Supabase Auth

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Email**: Resend API
- **UI**: Tailwind CSS + shadcn/ui components
- **Analytics**: Resend webhooks for email tracking

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Resend Configuration
RESEND_API_KEY=your_resend_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron Security
CRON_SECRET=your_cron_secret_here
```

### 2. Database Setup

1. Create a new Supabase project
2. Run the SQL migration in `supabase/migrations/001_initial_schema.sql`
3. Enable Row Level Security (RLS) on all tables
4. Configure authentication providers in Supabase dashboard

### 3. Resend Setup

1. Create a Resend account and get your API key
2. Verify your domain in Resend dashboard
3. Update the `from` email in `lib/resend.ts` with your verified domain
4. Configure webhook endpoint in Resend: `https://yourdomain.com/api/webhooks/resend`

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

## Usage

### Adding Contacts

1. Navigate to `/contacts`
2. Click "Add Contact" to create individual contacts
3. Use "Import CSV" for bulk contact import

### Creating Email Sequences

1. Go to `/sequences`
2. Click "Create Sequence"
3. Configure 4 email templates with intervals
4. Preview emails before saving

### Triggering Sequences

1. Visit `/contacts/trigger-sequence`
2. Select a sequence and contacts
3. Click "Trigger Sequence" to start automation

### Monitoring Performance

1. View dashboard metrics on the home page
2. Check sequence analytics at `/sequences/[id]/analytics`
3. Monitor email logs and engagement rates

## API Endpoints

- `POST /api/sequences/[id]/trigger` - Trigger sequence for selected contacts
- `POST /api/cron/send-emails` - Process email queue (cron job)
- `POST /api/webhooks/resend` - Receive Resend webhook events
- `GET /unsubscribe/[token]` - Public unsubscribe page

## Cron Job Setup

For production, set up a cron job to process the email queue:

```bash
# Run every 5 minutes
*/5 * * * * curl -X POST https://yourdomain.com/api/cron/send-emails -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Security Features

- **Authentication**: Supabase Auth with email/password
- **Row Level Security**: Database-level access control
- **Webhook Verification**: Secure webhook signature validation
- **Personalized Unsubscribe**: Contact-specific unsubscribe tokens
- **Rate Limiting**: Respects Resend's 100 emails/batch limit

## Database Schema

The system uses 7 main tables:

1. **contacts** - Contact information and lead status
2. **email_sequences** - Email sequence configurations
3. **email_templates** - Individual email templates
4. **contact_sequences** - Contact-sequence relationships
5. **email_logs** - Email delivery and engagement tracking
6. **contact_notes** - Contact interaction notes
7. **email_queue** - Email sending queue with priority

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch
4. Set up cron job using Vercel Cron

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Support

For issues and questions:
1. Check the implementation in the codebase
2. Review the database schema and API endpoints
3. Ensure all environment variables are configured correctly
4. Verify Supabase and Resend configurations

## License

MIT License - feel free to use this project for your own CRM needs.