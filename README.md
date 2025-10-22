# CRM Marketing Automation System

A modern CRM system built with Next.js 15, Supabase, and Resend for email marketing automation.

## Features

- **Contact Management**: Import, manage, and organize contacts
- **Email Sequences**: Create automated email marketing campaigns
- **Analytics**: Track email performance and engagement
- **Email Templates**: Rich HTML email templates with personalization
- **Unsubscribe Management**: Built-in unsubscribe functionality
- **Webhook Integration**: Real-time email event tracking

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Email Service**: Resend
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Resend account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd crm
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

4. Configure your environment variables in `.env.local`:
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

5. Set up the database:
   - Run the migration in `supabase/migrations/001_initial_schema.sql` in your Supabase dashboard
   - Or use the Supabase CLI: `supabase db push`

6. Start the development server:
```bash
npm run dev
```

## Database Schema

The application uses the following main tables:

- `contacts` - Contact information
- `email_sequences` - Marketing campaigns
- `email_templates` - Email content templates
- `contact_sequences` - Contact-campaign relationships
- `email_queue` - Email sending queue
- `email_logs` - Email delivery tracking

## API Routes

- `POST /api/sequences/[id]/trigger` - Trigger email sequence
- `POST /api/webhooks/resend` - Resend webhook handler
- `POST /api/auth/logout` - User logout
- `POST /api/cron/send-emails` - Process email queue

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `RESEND_API_KEY` | Resend API key for sending emails | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |
| `CRON_SECRET` | Secret for cron job security | Yes |

## Features Overview

### Contact Management
- Import contacts via CSV
- Contact details and tags
- Lead status tracking
- Contact history

### Email Sequences
- Multi-step email campaigns
- Customizable intervals
- Rich HTML templates
- Personalization variables

### Analytics
- Email open rates
- Click tracking
- Bounce handling
- Unsubscribe management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, please open an issue in the GitHub repository.