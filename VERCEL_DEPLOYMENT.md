# Vercel Deployment Guide

## Prerequisites

1. A Vercel account
2. A PostgreSQL database (Neon recommended - integrates seamlessly with Vercel)
3. Stripe account for payment processing (if using card payments)

## Environment Variables

Add these environment variables in the Vercel dashboard (Project Settings > Environment Variables):

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `SESSION_SECRET` | Secret key for session encryption | A random 32+ character string |

### Optional Variables (for payment processing)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (for frontend) |

## Deployment Steps

### 1. Set Up Neon Database

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project and database
3. Copy the connection string (DATABASE_URL)

### 2. Run Database Migrations

Before deploying, run the database migrations locally or use Neon's SQL editor:

```bash
# Set DATABASE_URL locally
export DATABASE_URL="your_neon_connection_string"

# Run migrations
npm run db:push

# Seed the database with initial data
npx tsx server/seed.ts
```

### 3. Deploy to Vercel

#### Option A: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Option B: Connect GitHub Repository

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repository
5. Add the environment variables
6. Deploy

### 4. Configure Stripe Webhook (if using payments)

1. In Stripe Dashboard, go to Developers > Webhooks
2. Add a new endpoint: `https://your-vercel-domain.vercel.app/api/stripe/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy the signing secret and add it as `STRIPE_WEBHOOK_SECRET` in Vercel

## Build Configuration

The project uses these build settings (already configured in vercel.json):

- **Build Command:** `vite build`
- **Output Directory:** `dist/public`
- **Install Command:** `npm install`

## File Structure for Vercel

```
/
├── api/
│   └── index.ts      # Serverless API entry point
├── dist/
│   └── public/       # Built frontend files
├── vercel.json       # Vercel configuration
└── ...
```

## Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` includes `?sslmode=require` for Neon
- Check that your Neon project allows connections from Vercel

### Session Issues
- Make sure `SESSION_SECRET` is set
- Sessions are stored in PostgreSQL via connect-pg-simple

### API Routes Not Working
- Check Vercel function logs in the dashboard
- Ensure all environment variables are set correctly

## Default Admin Credentials

After seeding the database, you can log in with:
- **Username:** admin
- **Password:** admin123

**Important:** Change the admin password after your first login!
