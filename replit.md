# Baby Banz Earmuffs Gemach

## Overview

This is a full-stack web application for managing a gemach (lending library) network that lends Baby Banz noise-cancelling earmuffs to protect infants' hearing at events and celebrations. The platform connects borrowers with local gemach locations worldwide, handles deposit payments, and provides administrative tools for gemach operators.

The application serves three main user types:
- **Public users** - Find locations, submit deposit payments, apply to open new gemachs
- **Operators** - Manage individual gemach locations, track transactions and returns
- **Admins** - Oversee all locations, approve applications, configure payment methods system-wide

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with React plugin

The frontend follows a pages-based structure under `client/src/pages/` with reusable components in `client/src/components/`. Path aliases are configured (`@/` for client source, `@shared/` for shared code).

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: REST endpoints under `/api/` prefix
- **Authentication**: Passport.js with local strategy, session-based auth using express-session
- **Session Storage**: MemoryStore (development) with connect-pg-simple available for production

The server uses a modular structure with specialized services:
- `routes.ts` - Main API route definitions
- `storage.ts` - Data access layer interface
- `auth.ts` - Authentication setup and user management
- Payment processing services (sync, detection, refund, analytics)
- Email notification and audit trail services

### Data Layer
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (via Neon serverless driver)
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command

Key entities: Users, Regions, CityCategories, Locations, Transactions, Payments, PaymentMethods, GemachApplications, Contacts

### Authentication & Authorization
- Role-based access control: user, operator, admin
- Invite code system for registration
- Protected routes on both frontend and backend
- **Operator PIN-based login**: Operators authenticate using location code + PIN (e.g., "#1" + "1234") instead of username/password
  - Login: POST `/api/operator/login` stores `operatorLocationId` in session
  - Logout: POST `/api/operator/logout` clears session
  - All operator endpoints support dual auth (Passport-based or PIN-based session)
  - Default PIN for all locations: "1234" (configurable via admin panel)
  - Frontend stores location in localStorage for UX, server validates via session
- Operators are associated with specific locations

### Payment Processing
- Multiple payment method support (Stripe, PayPal, credit cards, Zelle, Venmo, cash)
- $20 refundable deposit model
- Fee calculation and processing
- Payment status monitoring and webhook handling
- Audit trail for compliance

### Operator Dashboard Features
The operator dashboard (`/operator/dashboard`) provides a redesigned interface for managing headband lending:

**Inventory Management:**
- Color-based inventory tracking via dedicated `inventory` table (normalized database structure)
- Each inventory record has: locationId, color, quantity
- API endpoint: GET/POST/DELETE `/api/locations/:id/inventory`
- Visual color swatches for red, blue, black, white, pink, purple, green, orange, yellow, gray
- Low stock alerts for colors with ≤3 items
- Add Stock dialog to log incoming inventory by color

**Lend Wizard (4 steps):**
1. Color Selection - Visual swatches showing available quantities
2. Borrower Info - Name/phone with auto-fill for repeat borrowers
3. Deposit - Numeric keypad with cash/card toggle
4. Confirmation - Summary of all details before processing

**Return Wizard (3 steps):**
1. Borrower Selection - Phone search or list with overdue indicators
2. Refund Options - Full or partial refund with damage deductions
3. Confirmation - Refund amount and details before processing

**Transaction Fields:**
- `headbandColor` - Color of lent headband
- `depositPaymentMethod` - "cash" or "card"
- `expectedReturnDate` - For overdue detection
- `refundAmount` - For partial refunds

### Internationalization (i18n)
- **Languages**: English (en) and Hebrew (he) fully supported
- **Translation System**: Custom hook-based translation using React Context
  - Translations defined in `client/src/lib/translations.ts`
  - `useLanguage()` hook provides `t()` function and `isHebrew` boolean
  - Language toggle in header switches between English/Hebrew
- **RTL Support**: Automatic document direction switching (ltr/rtl) when language changes
- **Persistence**: Language preference saved to localStorage and restored on page load
- **Coverage**: All main public-facing pages and components are translated

## External Dependencies

### Payment Integrations
- **Stripe**: `@stripe/stripe-js` and `@stripe/react-stripe-js` for client-side payment processing
- **PayPal**: `@paypal/paypal-server-sdk` for server-side PayPal integration

### Database
- **Neon**: `@neondatabase/serverless` - Serverless PostgreSQL driver
- **Drizzle ORM**: Database queries and schema management
- Requires `DATABASE_URL` environment variable

### Email (Prepared but not connected)
- Email notification service structure exists in `server/email-notifications.ts`
- Requires SMTP or email service credentials (SendGrid, AWS SES) to activate

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe API secret (for payment processing)
- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` - PayPal credentials
- `SESSION_SECRET` - Express session secret (optional, has default)
- `ADMIN_EMAIL` - For admin notifications