# 🚀 CRM Marketing Automation System

A modern, full-featured CRM system built with Next.js 15, Supabase, and Resend for email marketing automation. Perfect for businesses looking to automate their outreach and nurture leads effectively.

## 🆕 Recent Updates

### Dashboard Improvements
- ✅ **Fixed Stats Queries**: Resolved bug with count queries showing accurate real-time data
- ✅ **Recent Activity Feed**: New section showing latest emails, contacts, and sequence activities
- ✅ **Real-time Metrics**: Live dashboard with actual database statistics

### Contact Management Enhancements
- ✅ **Quick Search**: Added prominent real-time search bar with 150ms debouncing
- ✅ **Advanced Filters**: Filter contacts by company and lead status
- ✅ **Inline Status Editing**: Update contact status directly from table using dropdown
- ✅ **Performance Optimization**: Added database indexes for faster search (migration `007_add_search_indexes.sql`)
- ✅ **Loading Indicators**: Visual feedback during search and status updates

### New API Endpoints
- ✅ `PATCH /api/contacts/[id]/status` - Update contact lead status

## ✨ Key Features

### 📧 **Advanced Email Management**
- **Multi-Sender Support**: Configure multiple sender emails with custom names
- **Reply-To Configuration**: Set custom reply-to addresses for better email management
- **Email Sequences**: Create automated multi-step email campaigns
- **Rich Templates**: HTML email templates with personalization
- **Smart Scheduling**: Customizable email intervals and timing
- **Unsubscribe Management**: Built-in unsubscribe functionality
- **Email Replies**: Track and manage incoming email replies

### 👥 **Contact Management**
- **CSV Import**: Bulk import contacts from CSV files
- **Quick Search**: Real-time search across contact names and emails
- **Advanced Filters**: Filter by company, lead status, and more
- **Inline Status Editing**: Update contact status directly from the table
- **Contact Organization**: Tags, lead status, and detailed profiles
- **Individual Emails**: Send personalized one-off emails
- **Contact History**: Track all interactions and communications

### 📊 **Analytics & Tracking**
- **Live Dashboard**: Real-time stats for contacts, sequences, and email performance
- **Recent Activity**: Track latest emails sent, contacts added, and sequence triggers
- **Email Performance**: Open rates, click tracking, and delivery stats
- **Real-time Webhooks**: Live email event tracking via Resend
- **Bounce Handling**: Automatic bounce detection and management
- **Reply Tracking**: Monitor and manage email responses
- **Engagement Metrics**: Comprehensive analytics dashboard

### ⚙️ **Advanced Configuration**
- **Sender Email Settings**: Manage multiple verified sender addresses with reply-to configuration
- **Domain Verification**: Support for custom domains
- **Queue Management**: Reliable email delivery with retry logic
- **Security**: Row-level security and authentication
- **Email Forwarding**: Configure reply-to addresses for better email management

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Email Service**: Resend
- **Deployment**: Vercel (recommended)
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth
- **Email Delivery**: Resend with webhook support

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Resend account

### 📦 Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/crm-marketing-automation.git
cd crm-marketing-automation
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp env.example .env.local
```

4. **Configure your environment variables in `.env.local`:**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Resend Configuration
RESEND_API_KEY=your_resend_api_key_here
EMAIL_DOMAIN=yourdomain.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron Security
CRON_SECRET=your_cron_secret_here
```

5. **Set up the database:**
   - Run all migrations in `supabase/migrations/` in your Supabase dashboard (including the latest `007_add_search_indexes.sql` for optimized search performance)
   - Or use the Supabase CLI: `supabase db push`

6. **Start the development server:**
```bash
npm run dev
```

7. **Configure sender emails:**
   - Go to `/settings` in your application
   - Add your verified sender email addresses
   - Configure reply-to addresses for better email management
   - Set a default sender

## 🗄️ Database Schema

The application uses the following main tables:

- `contacts` - Contact information and profiles
- `email_sequences` - Marketing campaigns with sender configuration
- `email_templates` - Email content templates
- `contact_sequences` - Contact-campaign relationships
- `email_queue` - Email sending queue with sender information
- `email_logs` - Email delivery tracking and analytics
- `sender_emails` - Configured sender email addresses with reply-to settings
- `email_replies` - Track incoming email replies

## 🧩 Components

### Core Components
- **QuickSearch** (`components/quick-search.tsx`) - Real-time search with debouncing
- **ContactsFilter** (`components/contacts-filter.tsx`) - Advanced filtering for company and status
- **StatusSelect** (`components/status-select.tsx`) - Inline dropdown for editing contact status
- **EmailReplies** (`components/email-replies.tsx`) - Display and manage email replies

### Custom Hooks
- **useDebounce** (`lib/hooks/use-debounce.ts`) - Debounce hook for optimized search performance

## 🔌 API Routes

- `POST /api/sequences/[id]/trigger` - Trigger email sequence
- `POST /api/contacts/[id]/send-email` - Send individual email
- `PATCH /api/contacts/[id]/status` - Update contact status
- `POST /api/webhooks/resend` - Resend webhook handler
- `POST /api/webhooks/email-replies` - Handle incoming email replies
- `POST /api/auth/logout` - User logout
- `POST /api/cron/send-emails` - Process email queue

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your GitHub repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on push to main branch**

### Manual Deployment

1. **Build the application:**
```bash
npm run build
```

2. **Start the production server:**
```bash
npm start
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `RESEND_API_KEY` | Resend API key for sending emails | Yes |
| `EMAIL_DOMAIN` | Your verified domain for emails | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |
| `CRON_SECRET` | Secret for cron job security | Yes |

## 📋 Features Overview

### 👥 Contact Management
- **CSV Import**: Bulk import contacts from CSV files
- **Quick Search**: Real-time search with debouncing (searches name and email simultaneously)
- **Advanced Filters**: Filter by company name and lead status
- **Inline Status Editing**: Click-to-edit dropdown for updating lead status
- **Optimized Performance**: Database indexes for lightning-fast searches
- **Contact Details**: Name, email, phone, company, tags
- **Lead Status**: Track lead progression (new, qualified, disqualified, contacted, converted)
- **Contact History**: Complete interaction timeline
- **Social Profiles**: LinkedIn, Facebook, Instagram integration

### 📧 Email Sequences
- **Multi-step Campaigns**: Create sophisticated email sequences
- **Customizable Intervals**: Set timing between emails (days)
- **Rich HTML Templates**: Professional email designs
- **Personalization**: Use `{{NAME}}` and other variables
- **Sender Management**: Choose from configured sender emails
- **Reply-To Configuration**: Set custom reply-to addresses for each sender

### 📊 Analytics & Tracking
- **Live Dashboard**: Real-time statistics showing total contacts, sequences, emails sent, and open rates
- **Recent Activity Feed**: Track the latest 5 activities across emails, contacts, and sequences
- **Activity Timestamps**: Human-readable time formatting (e.g., "2 hours ago", "3 days ago")
- **Email Performance**: Open rates, click tracking, delivery stats
- **Real-time Webhooks**: Live email event tracking
- **Bounce Handling**: Automatic bounce detection and management
- **Reply Tracking**: Monitor and manage email responses
- **Unsubscribe Management**: Built-in unsubscribe functionality
- **Engagement Metrics**: Comprehensive analytics dashboard

### ⚙️ Advanced Configuration
- **Multi-Sender Support**: Configure multiple sender email addresses with reply-to settings
- **Domain Verification**: Support for custom domains
- **Queue Management**: Reliable email delivery with retry logic
- **Email Forwarding**: Configure reply-to addresses for better email management
- **Security**: Row-level security and authentication
- **Settings Management**: Centralized configuration

## 📧 Email Reply Management

### Reply-To Configuration
- **Custom Reply-To Addresses**: Set Gmail or other email addresses to receive replies
- **Sender Management**: Configure different reply-to addresses for different senders
- **Email Forwarding**: Replies automatically go to your configured inbox
- **Reply Tracking**: Monitor and manage incoming email responses

### Setup Instructions
1. **Configure Sender Emails**: Go to `/settings` and add your sender email addresses
2. **Set Reply-To Addresses**: Add your Gmail or preferred email for receiving replies
3. **Test Email Flow**: Send test emails and verify replies go to the correct address
4. **Monitor Responses**: Track replies in the contact details page

## 🎨 UI/UX Features

### Dashboard
- **Real-time Statistics**: Live metrics for contacts, sequences, emails sent, and open rates
- **Recent Activity Feed**: See the 5 most recent activities including emails sent, contacts added, and sequence triggers
- **Color-coded Activity Types**: Visual indicators for different activity types (blue for emails, green for contacts, purple for sequences)
- **Time Formatting**: Human-readable timestamps (e.g., "just now", "2 hours ago", "3 days ago")

### Contacts Page
- **Quick Search Bar**: Large, prominent search input with real-time filtering
- **Debounced Search**: Intelligent 150ms delay prevents excessive server requests
- **Search Loading Indicators**: Visual feedback with pulsing search icon and spinner
- **Advanced Filters Card**: Collapsible filters for company and status
- **Inline Status Editor**: Click-to-edit dropdown for changing contact status without navigating away
- **Optimistic UI Updates**: Status changes appear instantly with automatic revert on error
- **Server-side Filtering**: Efficient filtering with URL query parameters for shareable filtered views
- **Database Indexes**: Optimized search performance with indexed name and company fields

### Performance Optimizations
- **Debounced Inputs**: Reduce server load while maintaining responsive UI
- **Indexed Queries**: Fast ILIKE searches on name and company fields
- **Optimistic Updates**: Instant UI feedback while waiting for server responses
- **Smart Caching**: Next.js automatic caching for faster page loads

## 🎯 Use Cases

- **Lead Nurturing**: Automated follow-up sequences with reply management
- **Customer Onboarding**: Welcome series and tutorials
- **Sales Outreach**: Personalized prospecting campaigns
- **Event Marketing**: Event invitations and reminders
- **Newsletter Management**: Regular content distribution
- **Customer Support**: Manage customer inquiries through email replies

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Submit a pull request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the README and code comments
- **Issues**: Open an issue in the GitHub repository
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact us at support@yourdomain.com

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- Email delivery by [Resend](https://resend.com/)
- UI components by [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

⭐ **Star this repository if you find it helpful!**