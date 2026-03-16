# Kevi.io - Sales Intelligence Platform

A real-time sales intelligence platform that tracks rep activity, measures productivity, and drives revenue growth through data-driven insights.

## Features

### Core Features
- **Real-time Activity Tracking**: Chrome extension captures keystroke and focus time data
- **Team Analytics**: View productivity and performance metrics across entire team
- **CRM Integration**: Webhook support for HubSpot and Salesforce
- **Performance Dashboards**: Six specialized views for team and individual metrics
- **Coaching Intelligence**: Automated flags for underperforming reps

### Dashboard Views

1. **Productivity - Team**: Leaderboards, domain breakdown, keystroke intensity
2. **Productivity - Individual**: Personal activity trends and performance patterns
3. **Performance - Team**: Deal creation, pipeline value, conversion metrics
4. **Performance - Individual**: Individual deal tracking and KPI analysis
5. **Conversion - Team**: Funnel analysis, conversion rates by rep
6. **Conversion - Individual**: Deal stage progression and activity correlation
7. **Team Management**: Rep management, extension token generation, settings

### Chrome Extension

- Automatic keystroke and focus time tracking
- Domain classification (CRM, Email, Communication, etc.)
- Real-time data sync every 60 seconds
- Non-intrusive popup interface

## Tech Stack

- **Frontend**: Next.js 16 with React 19, TypeScript
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Visualizations**: Recharts for interactive charts
- **Extension**: Chrome Extension Manifest v3

## Setup

### Prerequisites
- Node.js 18+ and pnpm
- Supabase account
- Chrome browser for extension testing

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Run the development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Chrome Extension

### Development Setup

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top-right)
3. Click "Load unpacked"
4. Select the `/extension` directory

### Extension Features

- **Activation**: Users paste extension token from dashboard
- **Tracking**: Captures all keystroke and domain activity
- **Sync**: Uploads data to backend every 60 seconds
- **Storage**: Uses Chrome sync storage for cross-device settings

## API Routes

### Authentication
- `POST /api/auth/signout` - Sign out current user

### Reps Management
- `GET /api/reps` - List all reps for company
- `POST /api/reps` - Create new rep
- `PUT /api/reps/:id` - Update rep
- `DELETE /api/reps/:id` - Delete rep

### Events
- `POST /api/events` - Ingest activity events from extension

### Dashboard APIs
- `GET /api/dashboard/productivity` - Get team productivity data
- `GET /api/dashboard/performance` - Get performance metrics
- `GET /api/dashboard/conversion` - Get conversion data

### Webhooks
- `POST /api/webhooks/hubspot` - HubSpot deal events

## Database Schema

### Tables
- **companies**: Company records with RLS isolation
- **reps**: Sales representatives with extension tokens
- **activity_events**: Keystroke and focus data from extension
- **crm_events**: Deal and pipeline events from CRM webhooks
- **daily_summaries**: Aggregated daily metrics for quick queries

All tables have Row Level Security policies enforcing company-level data isolation.

## Deployment

### Vercel Deployment

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy:
```bash
vercel deploy --prod
```

### Chrome Web Store Publication

1. Generate extension ZIP:
```bash
cd extension && zip -r ../kevi-extension.zip .
```

2. Upload to [Chrome Web Store Developer Console](https://chrome.google.com/webstore/developer/dashboard)
3. Complete store listing and publish

## Authentication Flow

1. Users sign up via email/password
2. Email confirmation required
3. On first login, redirected to Team Management
4. Copy extension token and paste into Chrome extension
5. Extension begins tracking activity

## Development Notes

- All API routes use server-side Supabase client for security
- Activity data aggregates into daily_summaries via scheduled cron
- Chrome extension uses token-based auth (no user password on extension)
- RLS policies prevent cross-company data access
- Dashboard data queries optimized with indexes on rep_id, recorded_at, date

## License

Proprietary - Kevi.io
