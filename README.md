# GemachHub

A comprehensive web-based platform for managing Gemach (Jewish free-loan charity) locations, inventory tracking, deposit management, and payment processing.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Installation](#installation)
- [Database Configuration](#database-configuration)
- [Development](#development)
- [Application Structure](#application-structure)
- [API Documentation](#api-documentation)
- [Authentication & Authorization](#authentication--authorization)
- [Payment Integration](#payment-integration)
- [Deployment](#deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

GemachHub is a full-stack web application designed to streamline the operations of Gemach organizations. It provides tools for:

- Managing multiple Gemach locations across different regions and cities
- Tracking inventory (headband colors and quantities)
- Processing borrower deposits and returns
- Handling multiple payment methods (Cash, Stripe, PayPal, Square, Venmo, Zelle)
- Managing operator and admin access with role-based permissions
- Generating analytics and reports
- Processing applications for new Gemach locations

The system supports three types of users:
1. **Admins**: Full system access for managing locations, users, and global settings
2. **Operators**: Location-specific access for managing transactions and inventory
3. **Borrowers**: Public users who can browse locations and borrow items

## ✨ Features

### Core Features
- **Multi-Location Management**: Organize locations by regions (continents) and cities
- **Inventory Tracking**: Real-time tracking of headbands by color (red, blue, black, white, pink, purple, green, orange, yellow, gray)
- **Transaction Management**: Complete borrowing and return workflow with deposit tracking
- **Payment Processing**: Support for multiple payment gateways and manual payment methods
- **Deposit Handling**: Automated deposit collection and refund processing
- **Self-Service Deposits**: QR code-based self-deposit system for borrowers

### Admin Features
- Dashboard with analytics and key metrics
- Location management (create, update, enable/disable)
- Transaction monitoring and reporting
- Application review for new Gemach locations
- Payment method configuration
- Payment confirmation and monitoring
- User management and invite code generation
- Audit trail tracking

### Operator Features
- Location-specific dashboard
- Borrower transaction processing
- Inventory management
- Deposit tracking and refunds
- PIN-based authentication

### Public Features
- Browse locations by region and city
- View location details and inventory
- Apply for new Gemach location
- Contact form
- Multi-language support (English and Hebrew)

## 🛠 Technology Stack

### Frontend
- **Framework**: React 18.3.1
- **Routing**: Wouter 3.3.5
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS 3.4.17 with Tailwind CSS v4.1.3 plugin
- **State Management**: TanStack Query (React Query) 5.60.5
- **Forms**: React Hook Form 7.55.0 with Zod validation
- **Animations**: Framer Motion 11.13.1
- **Icons**: Lucide React 0.453.0, React Icons 5.4.0
- **Date Handling**: date-fns 3.6.0
- **Charts**: Recharts 2.15.2
- **Theme**: next-themes 0.4.6

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express 4.21.2
- **Language**: TypeScript 5.6.3
- **Database**: PostgreSQL 16 (Neon serverless)
- **ORM**: Drizzle ORM 0.39.1
- **Authentication**: Passport.js (Local Strategy)
- **Session Management**: express-session with connect-pg-simple
- **Validation**: Zod 3.24.2
- **Real-time**: WebSocket (ws 8.18.0)

### Payment Providers
- **Stripe**: @stripe/stripe-js 7.3.1, @stripe/react-stripe-js 3.7.0, stripe 18.2.1
- **PayPal**: @paypal/paypal-server-sdk 1.1.0

### Development Tools
- **Build Tool**: Vite 5.4.14
- **Bundler**: esbuild 0.25.0
- **Database Migrations**: Drizzle Kit 0.30.4
- **TypeScript**: TSX 4.19.1 for development
- **Linting**: TypeScript compiler check

## 🏗 Architecture

### Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (React)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │   Pages     │  │ Components  │  │    Hooks     │   │
│  └─────────────┘  └─────────────┘  └──────────────┘   │
│         │                 │                 │           │
│         └─────────────────┴─────────────────┘           │
│                       │                                  │
│              ┌────────▼────────┐                        │
│              │  API Client     │                        │
│              │ (React Query)   │                        │
│              └────────┬────────┘                        │
└───────────────────────┼──────────────────────────────────┘
                        │
                        │ HTTP/WebSocket
                        │
┌───────────────────────▼──────────────────────────────────┐
│                  Server (Express)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐    │
│  │   Routes    │  │    Auth     │  │   Services   │    │
│  └─────────────┘  └─────────────┘  └──────────────┘    │
│         │                 │                 │            │
│         └─────────────────┴─────────────────┘            │
│                       │                                   │
│              ┌────────▼────────┐                         │
│              │    Storage      │                         │
│              │  (Drizzle ORM)  │                         │
│              └────────┬────────┘                         │
└───────────────────────┼───────────────────────────────────┘
                        │
                        │
┌───────────────────────▼───────────────────────────────────┐
│              PostgreSQL Database (Neon)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Users   │ │Locations │ │Inventory │ │Payments  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└────────────────────────────────────────────────────────────┘
```

### Project Structure

```
GemachHub/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   │   ├── admin/           # Admin-specific components
│   │   │   ├── auth/            # Authentication components
│   │   │   ├── home/            # Home page components
│   │   │   ├── layout/          # Layout components (header, footer)
│   │   │   ├── locations/       # Location browsing components
│   │   │   ├── payment/         # Payment processing components
│   │   │   ├── transactions/    # Transaction components
│   │   │   └── ui/              # UI components (Radix UI wrappers)
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── use-auth.tsx     # Authentication hook
│   │   │   ├── use-language.tsx # Multi-language support
│   │   │   └── use-operator-auth.tsx # Operator authentication
│   │   ├── lib/                 # Utility functions and configurations
│   │   ├── pages/               # Page components
│   │   │   ├── admin/           # Admin pages (dashboard, locations, etc.)
│   │   │   ├── operator/        # Operator pages
│   │   │   ├── home.tsx         # Public home page
│   │   │   ├── locations.tsx    # Location browsing page
│   │   │   ├── borrow.tsx       # Borrow flow page
│   │   │   ├── apply.tsx        # Application form
│   │   │   ├── contact.tsx      # Contact form
│   │   │   └── self-deposit.tsx # Self-deposit page
│   │   ├── App.tsx              # Main app component with routing
│   │   ├── main.tsx             # Entry point
│   │   └── index.css            # Global styles
│   └── index.html               # HTML template
├── server/                      # Backend Express server
│   ├── index.ts                 # Server entry point
│   ├── routes.ts                # API route definitions
│   ├── auth.ts                  # Authentication setup (Passport.js)
│   ├── storage.ts               # Database access layer
│   ├── vite.ts                  # Vite development server integration
│   ├── payment-sync.ts          # Payment synchronization service
│   ├── deposit-sync.ts          # Deposit synchronization service
│   ├── deposit-refund.ts        # Deposit refund service
│   ├── deposit-detection.ts     # Deposit detection service
│   ├── email-notifications.ts   # Email notification service
│   ├── audit-trail.ts           # Audit logging service
│   └── analytics-engine.ts      # Analytics and reporting engine
├── shared/                      # Shared code between client and server
│   └── schema.ts                # Database schema and Zod validators
├── attached_assets/             # Static assets (images, videos)
├── migrations/                  # Database migration files
├── components.json              # Shadcn UI configuration
├── drizzle.config.ts           # Drizzle ORM configuration
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── package.json                # Node.js dependencies and scripts
└── .replit                     # Replit deployment configuration
```

## 📋 Prerequisites

Before installing GemachHub, ensure you have the following installed:

- **Node.js**: Version 20.x or higher
- **npm**: Version 10.x or higher (comes with Node.js)
- **PostgreSQL**: Version 16 or higher (or access to a PostgreSQL database)
- **Git**: For cloning the repository

### Optional but Recommended
- **Replit Account**: For easy deployment and hosting
- **Neon Account**: For serverless PostgreSQL database
- **Stripe Account**: For credit card payment processing
- **PayPal Business Account**: For PayPal payment processing

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Session Secret (generate a random string)
SESSION_SECRET="your-super-secret-session-key-change-this"

# Node Environment
NODE_ENV="development"  # or "production"

# Server Configuration
PORT=5000

# Payment Provider API Keys (Optional - only if using these services)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
PAYPAL_WEBHOOK_ID="..."

# Email Configuration (Optional - for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@gemachhub.com"

# Application Settings
APP_URL="http://localhost:5000"  # or your production URL
```

### Environment Variable Details

#### DATABASE_URL
- **Format**: `postgresql://[user]:[password]@[host]:[port]/[database]`
- **Neon Format**: `postgresql://[user]:[password]@[endpoint].neon.tech/[database]?sslmode=require`
- **Required**: Yes
- **Description**: Connection string for PostgreSQL database

#### SESSION_SECRET
- **Required**: Yes
- **Description**: Secret key for signing session cookies. Generate using: `openssl rand -base64 32`

#### Payment Provider Keys
- **Required**: Only if enabling payment processing
- **Stripe**: Get from https://dashboard.stripe.com/apikeys
- **PayPal**: Get from https://developer.paypal.com/dashboard/applications

## 📦 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/mooses23/GemachHub.git
cd GemachHub
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required dependencies for both frontend and backend.

### Step 3: Set Up Environment Variables

```bash
# Copy the example environment file (if provided)
cp .env.example .env

# Edit the .env file with your actual values
nano .env  # or use your preferred editor
```

### Step 4: Set Up the Database

See [Database Configuration](#database-configuration) section below.

### Step 5: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🗄 Database Configuration

### Using Neon (Recommended for Production)

1. **Create a Neon Account**: Sign up at https://neon.tech
2. **Create a New Project**
3. **Get Connection String**: Copy the connection string from your project dashboard
4. **Add to .env**:
   ```bash
   DATABASE_URL="postgresql://[user]:[password]@[endpoint].neon.tech/[database]?sslmode=require"
   ```

### Using Local PostgreSQL

1. **Install PostgreSQL 16**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql-16
   
   # macOS
   brew install postgresql@16
   ```

2. **Create Database**:
   ```bash
   createdb gemachhub
   ```

3. **Add to .env**:
   ```bash
   DATABASE_URL="postgresql://localhost:5432/gemachhub"
   ```

### Database Schema Migration

The application uses Drizzle ORM for database management.

#### Push Schema to Database

```bash
npm run db:push
```

This command will:
- Read the schema from `shared/schema.ts`
- Create all necessary tables in your database
- Update existing tables if schema changes

#### Database Schema Overview

The database consists of the following main tables:

1. **users**: System users (admins and operators)
2. **regions**: Geographic regions (continents)
3. **cityCategories**: Cities within regions
4. **locations**: Gemach locations
5. **inventory**: Headband inventory by location and color
6. **transactions**: Borrowing transactions
7. **payments**: Payment records
8. **paymentMethods**: Available payment methods
9. **locationPaymentMethods**: Payment methods enabled per location
10. **gemachApplications**: Applications for new locations
11. **inviteCodes**: Registration invite codes
12. **contacts**: Contact form submissions
13. **globalSettings**: System-wide configuration

## 💻 Development

### Available Scripts

#### Development Mode
```bash
npm run dev
```
Starts the development server with hot-reload:
- Frontend: Vite dev server with HMR
- Backend: TSX with auto-restart on file changes
- Runs on port 5000

#### Build for Production
```bash
npm run build
```
Creates production builds:
- Frontend: Optimized bundle in `dist/public/`
- Backend: Compiled server in `dist/index.js`

#### Start Production Server
```bash
npm run start
```
Runs the production build (must run `npm run build` first)

#### Type Checking
```bash
npm run check
```
Runs TypeScript compiler to check for type errors without emitting files

#### Database Push
```bash
npm run db:push
```
Pushes database schema changes to the database

### Development Workflow

1. **Start Development Server**: `npm run dev`
2. **Make Changes**: Edit files in `client/`, `server/`, or `shared/`
3. **Hot Reload**: Changes are automatically reflected
4. **Check Types**: Run `npm run check` periodically
5. **Update Database**: Run `npm run db:push` if schema changes
6. **Test**: Test your changes in the browser
7. **Commit**: Commit your changes with meaningful messages

### Code Organization Principles

- **DRY (Don't Repeat Yourself)**: Shared code goes in `shared/`
- **Separation of Concerns**: Keep business logic in services
- **Type Safety**: Use TypeScript and Zod for runtime validation
- **Component Composition**: Build small, reusable components
- **API-First**: Define clear API contracts in `routes.ts`

## 📚 API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

### Authentication Endpoints

#### POST /api/register
Register a new user (requires invite code)
```json
{
  "username": "string",
  "password": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "operator",
  "inviteCode": "string"
}
```

#### POST /api/login
Login with username and password
```json
{
  "username": "string",
  "password": "string"
}
```

#### POST /api/logout
Logout current user

#### GET /api/user
Get current authenticated user

#### POST /api/operator/login
Operator login with location code and PIN
```json
{
  "locationCode": "string",
  "pin": "string"
}
```

### Region Endpoints

#### GET /api/regions
Get all regions

#### POST /api/regions
Create a new region (admin only)
```json
{
  "name": "string",
  "slug": "string",
  "displayOrder": 0
}
```

### City Category Endpoints

#### GET /api/city-categories
Get all city categories

#### GET /api/regions/:regionId/city-categories
Get city categories for a specific region

#### POST /api/city-categories
Create a new city category (admin only)
```json
{
  "name": "string",
  "slug": "string",
  "regionId": 0,
  "displayOrder": 0,
  "isPopular": false,
  "description": "string",
  "stateCode": "string"
}
```

### Location Endpoints

#### GET /api/locations
Get all locations

#### GET /api/regions/:slug/locations
Get locations by region slug

#### POST /api/locations
Create a new location (admin only)
```json
{
  "name": "string",
  "locationCode": "string",
  "contactPerson": "string",
  "address": "string",
  "zipCode": "string",
  "phone": "string",
  "email": "string",
  "regionId": 0,
  "cityCategoryId": 0,
  "depositAmount": 20,
  "cashOnly": false,
  "operatorPin": "string"
}
```

#### GET /api/locations/:id
Get location details by ID

#### PUT /api/locations/:id
Update location (admin only)

#### GET /api/locations/:id/inventory
Get inventory for a location

#### PUT /api/locations/:id/inventory
Update inventory for a location (operator/admin)
```json
{
  "red": 5,
  "blue": 3,
  "black": 10
}
```

### Transaction Endpoints

#### GET /api/transactions
Get all transactions (admin) or location transactions (operator)

#### POST /api/transactions
Create a new transaction (borrow)
```json
{
  "locationId": 0,
  "borrowerName": "string",
  "borrowerEmail": "string",
  "borrowerPhone": "string",
  "headbandColor": "red",
  "depositAmount": 20,
  "depositPaymentMethod": "cash",
  "expectedReturnDate": "2024-01-01",
  "notes": "string"
}
```

#### GET /api/transactions/:id
Get transaction details

#### PUT /api/transactions/:id/return
Mark transaction as returned
```json
{
  "refundAmount": 20,
  "notes": "string"
}
```

### Payment Endpoints

#### POST /api/payments
Create a payment
```json
{
  "transactionId": 0,
  "paymentMethod": "stripe",
  "depositAmount": 20,
  "processingFee": 90
}
```

#### GET /api/payments/:id
Get payment details

#### POST /api/payments/:id/confirm
Confirm payment status

### Application Endpoints

#### POST /api/applications
Submit a new Gemach application
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "streetAddress": "string",
  "city": "string",
  "state": "string",
  "zipCode": "string",
  "country": "string",
  "community": "string",
  "message": "string"
}
```

#### GET /api/applications
Get all applications (admin only)

#### PUT /api/applications/:id
Update application status (admin only)

### Contact Endpoints

#### POST /api/contacts
Submit a contact form
```json
{
  "name": "string",
  "email": "string",
  "subject": "string",
  "message": "string"
}
```

#### GET /api/contacts
Get all contact submissions (admin only)

### Payment Method Endpoints

#### GET /api/payment-methods
Get all payment methods

#### POST /api/payment-methods
Create/configure payment method (admin only)

#### GET /api/locations/:id/payment-methods
Get enabled payment methods for a location

## 🔐 Authentication & Authorization

### Authentication Methods

#### 1. Passport.js (Admin & Operators)
- **Strategy**: Local Strategy with username/password
- **Session**: Express-session with PostgreSQL store
- **Storage**: Sessions stored in database via connect-pg-simple
- **Cookie**: Secure HTTP-only cookie

#### 2. PIN-Based (Operators Only)
- **Method**: Location code + PIN
- **Session**: Stored in express-session
- **Use Case**: Quick operator access without full account

### User Roles

#### Admin
- Full system access
- Manages all locations
- Configures payment methods
- Reviews applications
- Generates reports and analytics
- Creates invite codes

#### Operator
- Location-specific access
- Manages transactions for assigned location
- Updates inventory
- Processes deposits and returns
- Views location analytics

### Route Protection

Routes are protected using middleware:

```typescript
// Require authentication
app.get('/api/protected', requireAuth, handler);

// Require specific role
app.get('/api/admin', requireRole('admin'), handler);

// Require operator for specific location
app.get('/api/locations/:id', requireOperatorForLocation, handler);
```

### Default Test Users

For development, the following test users are created:

```javascript
// Admin Account
username: "admin"
password: "admin123"
role: "admin"

// Operator Account (example)
username: "operator1"
password: "operator123"
role: "operator"
locationId: 1
```

**⚠️ Important**: Change these credentials in production!

## 💳 Payment Integration

### Supported Payment Methods

1. **Cash**: Manual payment tracking
2. **Stripe**: Credit/debit card processing
3. **PayPal**: PayPal account payments
4. **Square**: Square payment processing
5. **Venmo**: Manual Venmo tracking
6. **Zelle**: Manual Zelle tracking

### Stripe Integration

#### Setup
1. Create Stripe account at https://stripe.com
2. Get API keys from dashboard
3. Add to `.env`:
   ```bash
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

#### Configuration in Admin Panel
1. Navigate to Admin → Payment Methods
2. Enable Stripe
3. Enter API credentials
4. Set processing fee percentage
5. Save configuration

#### Webhook Setup
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Subscribe to events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy webhook secret to `.env`

### PayPal Integration

#### Setup
1. Create PayPal Business account
2. Go to https://developer.paypal.com/dashboard
3. Create app to get credentials
4. Add to `.env`:
   ```bash
   PAYPAL_CLIENT_ID="..."
   PAYPAL_CLIENT_SECRET="..."
   ```

#### Configuration in Admin Panel
1. Navigate to Admin → Payment Methods
2. Enable PayPal
3. Enter API credentials
4. Configure processing fees
5. Save configuration

### Payment Processing Flow

```
1. Borrower initiates transaction
   ↓
2. Select payment method
   ↓
3. If card/PayPal:
   - Create payment intent
   - Process payment
   - Wait for confirmation
   ↓
4. If cash:
   - Record manual payment
   - Mark as completed
   ↓
5. Transaction created
   ↓
6. Inventory updated
   ↓
7. Confirmation sent
```

### Processing Fees

Processing fees are configurable per payment method:
- **Stripe**: Default 2.9% + $0.30
- **PayPal**: Default 3.49% + $0.49
- **Square**: Default 2.6% + $0.10
- **Cash/Venmo/Zelle**: No fees

Fees can be:
- Set globally per payment method
- Overridden per location
- Absorbed by location or passed to borrower

## 🚀 Deployment

### Deploying to Replit

GemachHub is optimized for Replit deployment.

#### Step 1: Import to Replit
1. Log in to Replit
2. Click "Create Repl"
3. Select "Import from GitHub"
4. Enter repository URL: `https://github.com/mooses23/GemachHub`

#### Step 2: Configure Environment
1. Open "Secrets" (Environment Variables)
2. Add all required environment variables from `.env`
3. Ensure `DATABASE_URL` points to a PostgreSQL database

#### Step 3: Deploy
1. Click "Run" button
2. Application will build and start automatically
3. Access at the provided Replit URL

#### Replit Configuration

The `.replit` file contains:
```toml
modules = ["nodejs-20", "web", "postgresql-16"]
run = "npm run dev"

[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]

[[ports]]
localPort = 5000
externalPort = 80
```

### Deploying to Other Platforms

#### Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set SESSION_SECRET="your-secret"

# Deploy
git push heroku main
```

#### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

#### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Add PostgreSQL
railway add postgresql

# Deploy
railway up
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `SESSION_SECRET`
- [ ] Configure production database (with connection pooling)
- [ ] Set up SSL/TLS certificates
- [ ] Configure payment provider webhooks
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up CDN for static assets (optional)
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Change default admin credentials
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure email service for notifications

## 🧪 Testing

### Manual Testing

#### Test Admin Functions
1. Login as admin
2. Create a new region
3. Create a new city category
4. Create a new location
5. Create invite code
6. Configure payment methods
7. View analytics dashboard

#### Test Operator Functions
1. Login with location code + PIN
2. Create new transaction
3. Update inventory
4. Process return and refund
5. View location dashboard

#### Test Borrower Flow
1. Browse locations
2. Select a location
3. Fill out borrow form
4. Process deposit payment
5. Verify transaction created

### Database Testing

```bash
# Connect to database
psql $DATABASE_URL

# Check tables
\dt

# Check data
SELECT * FROM locations;
SELECT * FROM transactions;
SELECT * FROM inventory;
```

### API Testing

Use tools like Postman or curl:

```bash
# Test login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test get locations
curl http://localhost:5000/api/locations
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=3000 npm run dev
```

#### Database Connection Failed
- Check `DATABASE_URL` is correct
- Verify database is running
- Check firewall settings
- Ensure SSL mode is set correctly for Neon

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

#### Session Issues
- Clear browser cookies
- Check `SESSION_SECRET` is set
- Verify database connection for session store

#### Payment Integration Issues
- Verify API keys are correct
- Check webhook URLs are configured
- Use test mode keys for development
- Check Stripe/PayPal dashboard for errors

### Logging

#### Server Logs
Server logs are output to console during development:
```bash
npm run dev
```

#### Database Logs
Enable Drizzle logging in `server/storage.ts`:
```typescript
const db = drizzle(connection, { 
  schema,
  logger: true  // Enable SQL logging
});
```

### Getting Help

- **Documentation**: Check this README
- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Community**: Join our community forum

## 🤝 Contributing

We welcome contributions to GemachHub!

### How to Contribute

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/GemachHub.git
   cd GemachHub
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Write clear, commented code
   - Follow existing code style
   - Test your changes thoroughly

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "Add: your feature description"
   ```

5. **Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to GitHub repository
   - Click "New Pull Request"
   - Describe your changes
   - Submit for review

### Code Style Guidelines

- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Implement proper error handling
- Write self-documenting code
- Add comments for complex logic
- Use meaningful variable names

### Commit Message Format

```
Type: Short description

Longer description if needed

Types:
- Add: New feature
- Fix: Bug fix
- Update: Update existing feature
- Remove: Remove feature
- Refactor: Code refactoring
- Docs: Documentation changes
- Style: Code style changes
- Test: Test additions/changes
```

## 📄 License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2024 GemachHub

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 📞 Support

For support and questions:

- **Email**: support@gemachhub.com
- **GitHub Issues**: https://github.com/mooses23/GemachHub/issues
- **Documentation**: https://github.com/mooses23/GemachHub/wiki

---

**Built with ❤️ for the Gemach community**
