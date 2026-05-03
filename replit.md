# Baby Banz Earmuffs Gemach

## Overview

This full-stack web application manages a global network of gemachs (lending libraries) for Baby Banz noise-cancelling earmuffs. Its primary purpose is to protect infants' hearing by facilitating the lending process, managing deposits, and providing administrative tools. The platform supports three user types: public users (borrowers, new gemach applicants), operators (manage specific gemach locations), and admins (system-wide oversight). The project aims to expand the availability of ear protection for infants worldwide by streamlining the lending and management process.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript, Wouter for routing.
- **State Management**: TanStack React Query.
- **UI/Styling**: shadcn/ui (Radix UI) with Tailwind CSS.
- **Build Tool**: Vite.

### Backend
- **Runtime**: Node.js with Express, written in TypeScript (ESM modules).
- **API Pattern**: REST endpoints (`/api/`).
- **Authentication**: Passport.js (local strategy, session-based via express-session) with PostgreSQL for session storage.
- **Modularity**: Specialized services for routes, data access, authentication, payment processing, email, and audit trails.

### Data Layer
- **ORM**: Drizzle ORM.
- **Database**: PostgreSQL (via Neon serverless driver).
- **Schema**: Shared between client/server, covering users, locations, transactions, payments, and applications.

### Authentication & Authorization
- **Role-Based Access Control**: User, operator, admin roles.
- **Operator PIN-based Login**: Operators authenticate with location code + PIN.
- **Invite Code System**: For user registration.

### Payment Processing
- **Unified Deposit System**: $20 refundable deposit model.
- **Multiple Payment Methods**: Supports Stripe, PayPal, cash.
- **Cash Deposits**: Auto-complete upon recording.
- **Pay Later System**: Card verification via Stripe SetupIntents, charging only if items are damaged or not returned.
- **Refund System**: Role-based access for full or partial refunds.

### Operator Dashboard Features
- **Inventory Management**: Color-based tracking, low stock alerts, stock addition.
- **Lend Wizard**: Guided process for lending.
- **Self-Deposit Acceptance**: Operators can accept customer self-deposits.
- **Return Wizard**: Guided process for returns and refunds.

### Internationalization (i18n)
- **Languages**: English and Hebrew support with 704 translation keys.
- **Translation System**: Custom React hook-based.
- **RTL Support**: Automatic document direction switching for Hebrew.
- **Localization**: Date formatting and language preference persistence.

### Visual Design System (Glassmorphism Theme)
- **Theme**: Dark glassmorphism with translucent panels and blur effects.
- **Color Palette**: Slate gradient background, Ocean Blue primary, Coral Orange accent.
- **Effects**: Glass utility classes (`.glass-panel`, `.glass-card`) and ambient floating glow orbs.
- **Typography**: White headings, slate-300/400 body text.

### Contact Actions System
- **Components**: `ContactActions` (dark theme) and `ContactActionsLight` (light theme).
- **Features**: Clickable phone, SMS, and WhatsApp links with pre-filled, localized messages.
- **Integration**: Used in location cards and self-deposit forms.

### Schema Management & Hardening
- **Schema Upgrades**: `ensureSchemaUpgrades()` with `safe()` helper for fault-tolerant schema alterations.
- **Schema Drift Detection**: `runSchemaDriftCheck()` verifies schema integrity post-upgrades (production only).
- **Schema Snapshot**: `drizzle/schema-snapshot.sql` provides a replayable baseline, validated weekly via GitHub Actions and an in-process cron job.

## External Dependencies

### Payment Integrations
- **Stripe**: `@stripe/stripe-js`, `@stripe/react-stripe-js` (frontend); native Stripe SDK (backend).
- **PayPal**: `@paypal/paypal-server-sdk`.

### Database
- **PostgreSQL**: `pg` Pool driver.
- **Drizzle ORM**: For database interactions.

### Email
- Email notification service (`server/email-notifications.ts`) is structured for SMTP/email service integration.
- **Gmail API**: `server/gmail-client.ts` for admin inbox functionality (reading/sending emails).

### AI Services
- **OpenAI**: `server/openai-client.ts` for generating email drafts, classifications, and human review recommendations using a PLAYBOOK and DB context.
- **Admin Inbox**: Unified inbox at `/admin/inbox` merges Gmail and web-form messages.
- **AI Training**: Admin replies are captured in `reply_examples` and indexed into `kb_embeddings` for semantic retrieval in future drafts.

### SMS & WhatsApp
- **Twilio**: For sending SMS and WhatsApp messages (integrated into operator onboarding).